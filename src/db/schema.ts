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

    announceChannel: snowflake(),
    responsibleRole: snowflake(),
    responsibleResponsibleRole: snowflake(),
    responsibleCalendarUrl: varchar(),
    announceTime: integer(),
    remindTime: integer(),
    noReactChannels: snowflake()
        .array()
        .notNull()
        .default(sql`ARRAY[]::bigint[]`),
    mutedUsers: snowflake()
        .array()
        .notNull()
        .default(sql`ARRAY[]::bigint[]`),
})

export const reactions = pgTable('reactions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    displayName: varchar().notNull(),
    pattern: varchar().notNull(),
    emoji: varchar().notNull(),
})

export const discoveredReactions = pgTable(
    'discovered_reactions',
    {
        guildId: integer()
            .notNull()
            .references(() => guilds.id, { onDelete: 'cascade' }),
        reactionId: integer()
            .notNull()
            .references(() => reactions.id, { onDelete: 'cascade' }),
        userSnowflake: snowflake().notNull(),
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
    guildId: integer()
        .notNull()
        .references(() => guilds.id, { onDelete: 'cascade' }),
    day: smallint().notNull(),
    message: varchar().notNull(),
})
