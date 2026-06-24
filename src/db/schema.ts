import { sql } from 'drizzle-orm'
import {
    varchar,
    integer,
    pgTable,
    bigint,
    primaryKey,
    smallint,
} from 'drizzle-orm/pg-core'

export const guilds = pgTable('guilds', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    snowflake: bigint({ mode: 'bigint' }).notNull().unique(),

    announceChannel: varchar(),
    responsibleRole: varchar(),
    responsibleResponsibleRole: varchar(),
    responsibleCalendarUrl: varchar(),
    announceTime: integer(),
    remindTime: integer(),
    noReactChannels: varchar()
        .array()
        .notNull()
        .default(sql`ARRAY[]::varchar[]`),
    mutedUsers: varchar()
        .array()
        .notNull()
        .default(sql`ARRAY[]::varchar[]`),
})

export const reactions = pgTable('reactions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    pattern: varchar().notNull(),
    emoji: varchar().notNull(),
})

export const discoveredReactions = pgTable(
    'discovered_reactions',
    {
        guildId: integer()
            .notNull()
            .references(() => guilds.id),
        reactionId: integer()
            .notNull()
            .references(() => reactions.id),
        userSnowflake: bigint({ mode: 'bigint' }).notNull().unique(),
    },
    t => [primaryKey({ columns: [t.guildId, t.reactionId] })]
)

export const activities = pgTable('activities', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    type: varchar({
        enum: [
            'Playing',
            'Streaming',
            'Listening',
            'Watching',
            'Custom',
            'Competing',
        ],
    })
        .notNull()
        .default('Custom'),
})

export const reminders = pgTable('reminders', {
    guildId: integer()
        .notNull()
        .references(() => guilds.id),
    day: smallint().notNull(),
    message: varchar(),
})
