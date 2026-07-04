import db from './client'
import * as schema from './schema'
import * as fs from 'node:fs'
import { DATA_FILE, REACTIONS_FILE, ACTIVITIES_FILE } from '../environment'
import {
    ExtractTablesWithRelations,
    TransactionRollbackError,
} from 'drizzle-orm'
import { PgTransaction } from 'drizzle-orm/pg-core'
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'

interface FullData {
    guilds?: {
        [guildId: string]: GuildData
    }
}

interface GuildData {
    configuration?: GuildConfiguration
    discoveredReactions?: DiscoveredReactionsData
    noReactChannels?: string[]
    reminders?: RemindersData
}

interface GuildConfiguration {
    announceChannel?: string
    responsibleRole?: string
    responsibleResponsibleRole?: string
    responsibleCalendarUrl?: string
    /** Milliseconds after midnight that announcements should be sent */
    announceTime?: number
    /** Milliseconds after midnight that reminders should be sent */
    remindersTime?: number
}

interface DiscoveredReactionsData {
    [id: string]: string
}

interface RemindersData {
    days?: {
        [day: string]: string[]
    }
    muted?: string[]
}

function getData(): FullData {
    if (!fs.existsSync(DATA_FILE)) {
        return {}
    }
    const text = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(text) as FullData
}

type RawActivityConfig = {
    name: string
    type: string | undefined
}[]

interface ActivityOptions {
    name: string
    type: typeof schema.activities.$inferInsert.type
}

function getActivities(): ActivityOptions[] {
    if (fs.existsSync(ACTIVITIES_FILE)) {
        const text = fs.readFileSync(ACTIVITIES_FILE, 'utf8')

        try {
            const parsed = JSON.parse(text) as RawActivityConfig

            return parsed.map(({ name, type }) => {
                if (type !== undefined && !schema.isActivityType(type)) {
                    throw new Error(`Invalid activity type '${type}'`)
                }
                return { name, type }
            })
        } catch (error) {
            console.error(error)
            throw new Error(`Invalid activities in ${ACTIVITIES_FILE}`)
        }
    }
    return []
}

interface ReactionsDefinition {
    pattern: string
    emoji: string
}

interface ReactionsConfig {
    [id: string]: ReactionsDefinition
}

function getReactions(): ReactionsConfig {
    if (!fs.existsSync(REACTIONS_FILE)) return {}

    const text = fs.readFileSync(REACTIONS_FILE, 'utf8')

    try {
        const parsed = JSON.parse(text) as ReactionsConfig
        for (const key in parsed) {
            if (key.startsWith('$')) {
                delete parsed[key]
            }
        }
        return parsed
    } catch (error) {
        console.error(`Failed to parse reactions from ${REACTIONS_FILE}`)
        throw error
    }
}

type Transaction = PgTransaction<
    NodePgQueryResultHKT,
    Record<string, never>,
    ExtractTablesWithRelations<Record<string, never>>
>

async function migrateGuild(
    tx: Transaction,
    guildSnowflake: string,
    guildData: GuildData,
    reactionsIndex: Map<string, number>
) {
    const config = guildData.configuration
    const guildRow: typeof schema.guilds.$inferInsert = {
        snowflake: BigInt(guildSnowflake),
        announceTime: config?.announceTime,
        remindTime: config?.remindersTime,
        responsibleCalendarUrl: config?.responsibleCalendarUrl,
    }

    if (config?.announceChannel)
        guildRow.announceChannel = BigInt(config.announceChannel)
    if (config?.responsibleRole)
        guildRow.responsibleRole = BigInt(config.responsibleRole)
    if (config?.responsibleResponsibleRole)
        guildRow.responsibleResponsibleRole = BigInt(
            config.responsibleResponsibleRole
        )

    const noReactChannels = guildData.noReactChannels?.map(BigInt)
    if (noReactChannels !== undefined) {
        guildRow.noReactChannels = noReactChannels
    }

    const noPingUsers = guildData.reminders?.muted?.map(BigInt)
    if (noPingUsers !== undefined) {
        guildRow.noPingUsers = noPingUsers
    }

    console.log(`Inserting guild ${guildSnowflake} as `, guildRow)
    const result = await tx
        .insert(schema.guilds)
        .values(guildRow)
        .returning({ id: schema.guilds.id })

    const guildId = result[0].id

    const discoveredReactions = guildData.discoveredReactions ?? {}
    for (const oldId in discoveredReactions) {
        const userSnowflake = discoveredReactions[oldId]
        const newId = reactionsIndex.get(oldId)

        if (newId === undefined) {
            throw new Error(`Unknown reaction '${oldId}' discovered`)
        }
        console.log(`Inserting discovered reaction ${oldId}: ${userSnowflake}`)
        await tx.insert(schema.discoveredReactions).values({
            guildId,
            reactionId: newId,
            userSnowflake: BigInt(userSnowflake),
        })
    }

    for (const day in guildData.reminders?.days) {
        const reminders = guildData.reminders.days[day]
        for (const message of reminders) {
            await tx
                .insert(schema.reminders)
                .values({ guildId, day: parseInt(day), message })
        }
        console.log(`Inserted ${reminders.length} reminders on ${day}`)
    }
}

await db.transaction(async tx => {
    try {
        // == Migrate Reactions ==
        /** Map from reactions old ID to new ID. */
        const reactionsIndex = new Map<string, number>()

        const reactions = Object.entries(getReactions())
        for (const [id, { pattern, emoji }] of reactions) {
            console.log(`Inserting reaction /${pattern}/ -> ${emoji}`)
            const result = await tx
                .insert(schema.reactions)
                .values({ displayName: id, pattern, emoji })
                .returning({ id: schema.reactions.id })
            const newId = result[0].id

            reactionsIndex.set(id, newId)
        }
        console.log(`✅ Migrated ${reactions.length} reactions`)

        // == Migrate Activities ==
        const activities = getActivities()
        for (const { name, type } of activities) {
            console.log(`Inserting activity (${type}) ${name}`)
            await tx.insert(schema.activities).values({ name, type })
        }
        console.log(`✅ Migrated ${activities.length} activities`)

        // == Migrate Guilds ==
        const guilds = getData().guilds ?? {}
        for (const guildSnowflake in guilds) {
            const guildData = guilds[guildSnowflake]
            await migrateGuild(tx, guildSnowflake, guildData, reactionsIndex)
        }
        console.log(`✅ Migrated ${Object.keys(guilds).length} guilds`)

        console.log('✅ Migrated successfully')
    } catch (error) {
        console.error('❌ Failed to migrate from JSON data, see error below')
        console.error(error)

        console.log('🧹 Undoing database changes...')
        try {
            tx.rollback()
        } catch (error2) {
            // Ignore error if TransactionRollbackError
            if (!(error2 instanceof TransactionRollbackError)) throw error2
            process.exit(1)
        }
    }
})
