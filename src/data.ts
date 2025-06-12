import {
    PermissionFlagsBits,
    type Guild,
    type Role,
    type GuildMember,
} from 'discord.js'
import fs from 'fs'
import type {
    AnnounceChannel,
    DiscoveredReactionsData,
    FullData,
    GuildData,
    ParsedRemindersData,
    RemindersData,
} from './types'

const DATA_FILE = 'data.json'

function getData(): FullData {
    if (!fs.existsSync(DATA_FILE)) {
        return {}
    }
    const text = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(text)
    return parsed
}

function writeData(data: FullData) {
    const text = JSON.stringify(data)
    fs.writeFileSync(DATA_FILE, text, 'utf-8')
}

export function getGuildData(guildId: string): GuildData {
    const guilds = getData().guilds
    if (!guilds) return {}
    return guilds[guildId] ?? {}
}

export function writeGuildData(guildId: string, data: GuildData) {
    const guilds = getData().guilds ?? {}
    guilds[guildId] = data
    writeData({ ...getData(), guilds })
}

export async function getAnnouncementChannel(
    guild: Guild
): Promise<AnnounceChannel | undefined> {
    const data = getGuildData(guild.id)
    if (!data.announceChannel) return undefined

    const botMember = await guild.members.fetchMe()
    const botPermissions = botMember.permissions
    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) return undefined

    const channel = await guild.channels.fetch(data.announceChannel)
    if (channel?.isSendable()) {
        return channel as unknown as AnnounceChannel
    } else return undefined
}

export async function getResponsibleRole(
    guild: Guild
): Promise<Role | undefined> {
    const data = getGuildData(guild.id)
    if (!data.responsibleRole) return undefined
    const role = await guild.roles.fetch(data.responsibleRole)

    if (!role) return undefined
    if (!canUseRole(guild, role)) return undefined

    return role
}

export async function canUseRole(guild: Guild, role: Role): Promise<boolean> {
    const botMember = await guild.members.fetchMe()
    const botRole = botMember.roles.highest
    const botPermissions = botMember.permissions

    if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) return false
    if (botRole.position - role.position <= 0) return false
    if (role.managed) return false

    return true
}

export function getDiscoveredReactions(guild: Guild): DiscoveredReactionsData {
    const data = getGuildData(guild.id)
    return data?.discoveredReactions ?? {}
}

export async function getReactionDiscoveredBy(
    guild: Guild,
    id: string
): Promise<GuildMember | undefined> {
    const discovered = getDiscoveredReactions(guild)
    const userId = discovered[id]
    if (!userId) {
        return undefined
    }
    const user = (await guild.members.fetch()).get(userId)
    return user
}

/**
 * Set who discovered a reaction
 */
export function setReactionDiscoveredBy(
    guildId: string,
    id: string,
    userId: string | undefined
) {
    const data = getGuildData(guildId)
    const discovered = data?.discoveredReactions ?? {}
    if (userId) {
        discovered[id] = userId
    } else {
        delete discovered[id]
    }
    data.discoveredReactions = discovered
    writeGuildData(guildId, data)
}

/**
 * Get the channels that should not be reacted in
 * @param guildId
 * @returns the set of channel ids that should not be reacted in
 */
export function getNoReactChannels(guildId: string): Set<string> {
    const data = getGuildData(guildId)
    const noReactChannels = data?.noReactChannels ?? []
    return new Set(noReactChannels)
}

/**
 * Set the channels that should not be reacted in
 * @param guildId
 * @param channelIds the set of channel ids that should not be reacted in
 */
export function setNoReactChannels(
    guildId: string,
    channelIds: Iterable<string>
) {
    const data = getGuildData(guildId)
    data.noReactChannels = Array.from(channelIds)
    writeGuildData(guildId, data)
}

/**
 * Get the reminder-related data for a guild
 * @returns The reminder-related data
 */
export function getReminderData(guildId: string): ParsedRemindersData {
    const data = getGuildData(guildId)
    const reminderData = data?.reminders ?? {}
    // Create missing properties
    if (!reminderData.days) {
        reminderData.days = {}
    }
    if (!reminderData.muted) {
        reminderData.muted = []
    }

    // Convert days to ints
    const parsed = {
        days: Object.fromEntries(
            Object.entries(reminderData.days) //
                .map(([day, message]) => [parseInt(day), message])
        ),
        muted: reminderData.muted,
    }

    return parsed
}

export function setReminderData(
    guildId: string,
    reminderData: ParsedRemindersData
) {
    // Convert days to strings
    const newReminderData: RemindersData = {
        ...reminderData,
        days: Object.fromEntries(
            Object.entries(reminderData.days) //
                .map(([day, message]) => [day.toString(), message])
        ),
    }

    const data = getGuildData(guildId)
    data.reminders = newReminderData
    writeGuildData(guildId, data)
}

/**
 * Add a new reminder for the responsibility week
 * @param guildId The ID of the guild to add the reminder to
 * @param day Which day of the responsibility week the reminder should
 * be sent on. Note that this is not the same as the weekday: 1 means the first
 * day of the responsibility week regardless of whether the responsibility week
 * starts on a Monday or Tuesday
 * @param message What the reminder is for
 */
export function addReminder(guildId: string, day: number, message: string) {
    const data = getReminderData(guildId)
    if (!data.days[day]) {
        data.days[day] = [message]
    } else {
        data.days[day].push(message)
    }
    setReminderData(guildId, data)
}

/**
 * Remove a reminder for the responsibility week
 * @param guildId The ID of the guild to remove the reminder from
 * @param day Which day to remove a reminder from
 * @param index Which reminder to remove from the list of reminders for that day
 */
export function removeReminder(guildId: string, day: number, index: number) {
    const data = getReminderData(guildId)

    if (data.days[day]) {
        const removed = data.days[day].splice(index, 1)

        if (removed.length === 0) {
            throw `Det finns ingen påminnelse med index ${index} för dag ${day}`
        }
        // Delete list if empty
        if (data.days[day].length === 0) {
            delete data.days[day]
        }
    } else {
        throw `Det finns inga påminnelser dag ${day}`
    }
    setReminderData(guildId, data)
}

export function addReminderMutedUser(guildId: string, userId: string) {
    const data = getReminderData(guildId)
    if (data.muted.includes(userId)) {
        throw 'Du får redan inte påminnelser'
    } else {
        data.muted.push(userId)
    }
    setReminderData(guildId, data)
}

export function removeReminderMutedUser(guildId: string, userId: string) {
    const data = getReminderData(guildId)
    const index = data.muted.indexOf(userId)
    if (index === -1) {
        throw 'Du får redan påminnelser'
    } else {
        data.muted.splice(index, 1)
    }
    setReminderData(guildId, data)
}

/**
 * @returns The IDs of users who are muted for reminders
 */
export function getReminderMutedUsers(guildId: string): string[] {
    const data = getReminderData(guildId)
    return data.muted
}
