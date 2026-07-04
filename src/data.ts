import { Role, type Guild, type GuildMember } from 'discord.js'
import { ONE_HOUR_MS } from 'iamcal'
import type {
    AnnounceChannel,
    DiscoveredReaction,
    Reaction,
    RemindersByDay,
} from './types'
import {
    getAnnouncementChannel as getGuildAnnouncementChannel,
    getRole,
} from './util/guild'
import { CommandResponseError } from './util/command'
import db from './db/client'
import * as schema from './db/schema'
import { and, eq } from 'drizzle-orm'

export const DAYS = [
    'Måndagar',
    'Tisdagar',
    'Onsdagar',
    'Torsdagar',
    'Fredagar',
    'Lördagar',
    'Söndagar',
]

export async function initGuild(
    guildSnowflake: string | bigint
): Promise<typeof schema.guilds.$inferSelect> {
    const snowflake = BigInt(guildSnowflake)
    const result = await db
        .insert(schema.guilds)
        .values({ snowflake })
        .onConflictDoNothing()
        .returning()
    if (result.length === 0) {
        const result = await db
            .select()
            .from(schema.guilds)
            .where(eq(schema.guilds.snowflake, snowflake))
        return result[0]
    }
    return result[0]
}

export async function getGuildId(
    guildSnowflake: string | bigint
): Promise<number | null> {
    const result = await db
        .select({ guildId: schema.guilds.id })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guildSnowflake)))
    if (result.length === 0) return null
    return result[0].guildId
}

export async function getGuildSnowflake(
    guildId: number
): Promise<bigint | null> {
    const result = await db
        .select({ snowflake: schema.guilds.snowflake })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return null
    return result[0].snowflake
}

export type GuildConfigKey =
    | 'announceChannel'
    | 'responsibleRole'
    | 'responsibleResponsibleRole'
    | 'responsibleCalendarUrl'
    | 'announceTime'
    | 'remindTime'
export type GuildConfigType<KeyType extends GuildConfigKey> = NonNullable<
    (typeof schema.guilds.$inferSelect)[KeyType]
>

/**
 * Get the value of a column in the guild config.
 * @param guildId The ID of the guild to get the time for.
 * @param key The name of the column.
 * @returns The saved value, or null if not defined.
 */
export async function getGuildConfigValue<T extends GuildConfigKey>(
    guildId: number,
    key: T
): Promise<GuildConfigType<T> | null> {
    const result = await db
        .select({ field: schema.guilds[key] })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return null
    return result[0].field
}

/**
 * Set the value of a column in the guild config.
 * @param guildId The ID of the guild to get the time for.
 * @param key The name of the column.
 * @param value The new value of the column.
 */
export async function setGuildConfigValue<T extends GuildConfigKey>(
    guildId: number,
    key: T,
    value: GuildConfigType<T> | null
) {
    await db
        .update(schema.guilds)
        .set({ [key]: value })
        .where(eq(schema.guilds.id, guildId))
}

export async function getAnnouncementChannel(
    guild: Guild
): Promise<AnnounceChannel | undefined> {
    const result = await db
        .select({ announceChannel: schema.guilds.announceChannel })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guild.id)))
    if (result.length === 0) return undefined

    const { announceChannel } = result[0]
    if (announceChannel == null) return undefined
    return getGuildAnnouncementChannel(announceChannel.toString(), guild)
}

export async function getResponsibleRole(
    guild: Guild
): Promise<Role | undefined> {
    const result = await db
        .select({ responsibleRole: schema.guilds.responsibleRole })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guild.id)))
    if (result.length === 0) return undefined

    const { responsibleRole } = result[0]
    if (responsibleRole == null) return undefined
    return getRole(responsibleRole.toString(), guild)
}

export async function getResponsibleResponsibleRole(
    guild: Guild
): Promise<Role | undefined> {
    const result = await db
        .select({
            responsibleResponsibleRole:
                schema.guilds.responsibleResponsibleRole,
        })
        .from(schema.guilds)
        .where(eq(schema.guilds.snowflake, BigInt(guild.id)))
    if (result.length === 0) return undefined

    const { responsibleResponsibleRole } = result[0]
    if (responsibleResponsibleRole == null) return undefined
    return getRole(responsibleResponsibleRole.toString(), guild)
}

/**
 * Get how many milliseconds after midnight reminders should be sent in a guild.
 * @param guildId The ID of the guild to get the time for.
 * @returns The saved value, or the default time representing 13:00.
 */
export async function getRemindTime(guildId: number): Promise<number> {
    const DEFAULT = 13 * ONE_HOUR_MS // 13:00

    const result = await db
        .select({ remindTime: schema.guilds.remindTime })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return DEFAULT
    return result[0].remindTime ?? DEFAULT
}

/**
 * Get how many milliseconds after midnight announcements should be sent in a
 * guild.
 * @param guildId The ID of the guild to get the time for.
 * @returns The saved value, or the default time representing 09:00.
 */
export async function getAnnounceTime(guildId: number): Promise<number> {
    const DEFAULT = 9 * ONE_HOUR_MS // 09:00

    const result = await db
        .select({ announceTime: schema.guilds.announceTime })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return DEFAULT
    return result[0].announceTime ?? DEFAULT
}

export async function getReactions(): Promise<Reaction[]> {
    return await db.select().from(schema.reactions)
}

export async function getReaction(id: number): Promise<Reaction | null> {
    const result = await db
        .select()
        .from(schema.reactions)
        .where(eq(schema.reactions.id, id))
    return result[0] ?? null
}

export async function getDiscoveredReactions(
    guildId: number
): Promise<DiscoveredReaction[]> {
    const result = await db
        .select()
        .from(schema.discoveredReactions)
        .innerJoin(
            schema.reactions,
            eq(schema.discoveredReactions.reactionId, schema.reactions.id)
        )
        .where(eq(schema.discoveredReactions.guildId, guildId))

    return result.map(
        reaction =>
            ({
                id: reaction.discovered_reactions.reactionId,
                displayName: reaction.reactions.displayName,
                emoji: reaction.reactions.emoji,
                pattern: reaction.reactions.pattern,
                discoveredBy:
                    reaction.discovered_reactions.userSnowflake.toString(),
            }) satisfies DiscoveredReaction
    )
}

export async function getReactionDiscoveredBy(
    id: number,
    guild: Guild
): Promise<GuildMember | undefined> {
    const guildId = await getGuildId(guild.id)
    if (guildId === null) return undefined

    const result = await db
        .select({ userSnowflake: schema.discoveredReactions.userSnowflake })
        .from(schema.discoveredReactions)
        .where(
            and(
                eq(schema.discoveredReactions.guildId, guildId),
                eq(schema.discoveredReactions.reactionId, id)
            )
        )

    if (result.length === 0) return undefined
    const { userSnowflake } = result[0]
    const user = guild.members.cache.get(userSnowflake.toString())
    return user
}

/**
 * Register who discovered a reaction.
 */
export async function addDiscoveredReaction(
    guildId: number,
    reactionId: number,
    userSnowflake: string | bigint
) {
    await db.insert(schema.discoveredReactions).values({
        guildId,
        reactionId,
        userSnowflake: BigInt(userSnowflake),
    })
}

/**
 * Get the channels that should not be reacted in
 * @param guildId
 * @returns the set of channel ids/snowflakes that should not be reacted in
 */
export async function getNoReactChannels(
    guildId: number
): Promise<Set<string>> {
    const result = await db
        .select({ noReactChannels: schema.guilds.noReactChannels })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))

    if (result.length === 0) return new Set()
    const { noReactChannels } = result[0]
    return new Set(noReactChannels.map(channel => channel.toString()))
}

/**
 * Set the channels that should not be reacted in
 * @param guildId
 * @param channelIds the set of channel ids that should not be reacted in
 */
export async function setNoReactChannels(
    guildId: number,
    channelIds: Iterable<string>
) {
    const bigIntChannelIds = Array.from(channelIds).map(BigInt)
    await db
        .update(schema.guilds)
        .set({ noReactChannels: bigIntChannelIds })
        .where(eq(schema.guilds.id, guildId))
}

/**
 * Get the reminders in a guild
 * @returns The reminders grouped by day
 */
export async function getReminders(guildId: number): Promise<RemindersByDay> {
    const result = await db
        .select()
        .from(schema.reminders)
        .where(eq(schema.reminders.guildId, guildId))

    const days: RemindersByDay = {}

    result.forEach(reminder => {
        if (days[reminder.day] === undefined) {
            days[reminder.day] = []
        }
        days[reminder.day].push({
            id: reminder.id,
            message: reminder.message,
        })
    })
    return days
}

/**
 * Add a new reminder for the responsibility week
 * @param guildId The ID of the guild to add the reminder to
 * @param day Which day of the responsibility week the reminder should
 * be sent on, where 1 is Monday and 7 is Sunday.
 * @param message What the reminder is for
 */
export async function addReminder(
    guildId: number,
    day: number,
    message: string
) {
    await db.insert(schema.reminders).values({
        guildId,
        day,
        message,
    })
}

/**
 * Remove a reminder for the responsibility week
 * @param id The ID of the reminder
 * @param guildId The ID of the guild to remove the reminder from
 */
export async function removeReminder(id: number, guildId: number) {
    await db
        .delete(schema.reminders)
        .where(
            and(
                eq(schema.reminders.id, id),
                eq(schema.reminders.guildId, guildId)
            )
        )
}

/**
 * @returns The snowflakes of users who are muted for reminders
 */
export async function getNoPingUsers(guildId: number): Promise<bigint[]> {
    const result = await db
        .select({ noPingUsers: schema.guilds.noPingUsers })
        .from(schema.guilds)
        .where(eq(schema.guilds.id, guildId))
    if (result.length === 0) return []
    return result[0].noPingUsers
}

export async function isNoPingUser(
    guildId: number,
    userSnowflake: string | bigint
): Promise<boolean> {
    const noPingUsers = await getNoPingUsers(guildId)
    return noPingUsers.includes(BigInt(userSnowflake))
}

export async function addNoPingUser(
    guildId: number,
    userSnowflake: string | bigint
) {
    const snowflake = BigInt(userSnowflake)
    const noPingUsers = await getNoPingUsers(guildId)
    if (noPingUsers.includes(snowflake)) {
        throw new CommandResponseError('Du får redan inte påminnelser')
    }
    noPingUsers.push(snowflake)
    await db
        .update(schema.guilds)
        .set({ noPingUsers })
        .where(eq(schema.guilds.id, guildId))
}

export async function removeNoPingUser(
    guildId: number,
    userSnowflake: string | bigint
) {
    const snowflake = BigInt(userSnowflake)
    const noPingUsers = await getNoPingUsers(guildId)
    const index = noPingUsers.indexOf(snowflake)
    if (index === -1) {
        throw new CommandResponseError('Du får redan påminnelser')
    }
    noPingUsers.splice(index, 1)
    await db
        .update(schema.guilds)
        .set({ noPingUsers })
        .where(eq(schema.guilds.id, guildId))
}
