import { sql } from 'drizzle-orm'
import {
    varchar,
    integer,
    pgTable,
    bigint,
    primaryKey,
    smallint,
} from 'drizzle-orm/pg-core'

const snowflake = (name?: string) => {
    if (name) return bigint(name, { mode: 'bigint' })
    else return bigint({ mode: 'bigint' })
}

export const guilds = pgTable('guilds', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    snowflake: snowflake().notNull().unique(),

    announceChannel: snowflake('announce_channel'),
    responsibleRole: snowflake('responsible_role'),
    responsibleResponsibleRole: snowflake('responsible_responsible_role'),
    responsibleCalendarUrl: varchar('responsible_calendar_url'),
    announceTime: integer('announce_time'),
    remindTime: integer('remind_time'),
    noReactChannels: snowflake('no_react_channels')
        .array()
        .notNull()
        .default(sql`ARRAY[]::bigint[]`),
    noPingUsers: snowflake('no_ping_users')
        .array()
        .notNull()
        .default(sql`ARRAY[]::bigint[]`),
})

export const reactions = pgTable('reactions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    displayName: varchar('display_name').notNull(),
    pattern: varchar().notNull(),
    emoji: varchar().notNull(),
})

export const discoveredReactions = pgTable(
    'discovered_reactions',
    {
        guildId: integer('guild_id')
            .notNull()
            .references(() => guilds.id, { onDelete: 'cascade' }),
        reactionId: integer('reaction_id')
            .notNull()
            .references(() => reactions.id, { onDelete: 'cascade' }),
        userSnowflake: snowflake('user_snowflake').notNull(),
    },
    t => [primaryKey({ columns: [t.guildId, t.reactionId] })]
)

export const activityTypes = [
    'Competing',
    'Custom',
    'Listening',
    'Playing',
    'Streaming',
    'Watching',
] as const

export type ActivityType = (typeof activityTypes)[number]
export function isActivityType(
    maybeActivityType: unknown
): maybeActivityType is ActivityType {
    if (typeof maybeActivityType !== 'string') return false
    return (activityTypes as readonly string[]).includes(maybeActivityType)
}

export const activities = pgTable('activities', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    type: varchar({
        enum: activityTypes,
    })
        .notNull()
        .default('Custom'),
})

export const reminders = pgTable('reminders', {
    guildId: integer('guild_id')
        .notNull()
        .references(() => guilds.id, { onDelete: 'cascade' }),
    day: smallint().notNull(),
    message: varchar().notNull(),
})
