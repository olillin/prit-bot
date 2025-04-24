const { PermissionFlagsBits } = require('discord.js')
const fs = require('fs')

const DATA_FILE = 'data.json'

/**
 * @returns {Object}
 */
function getData() {
    if (!fs.existsSync(DATA_FILE)) {
        return {}
    }
    const text = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(text)
    return parsed
}

/**
 * @param {Object} data
 */
function writeData(data) {
    const text = JSON.stringify(data)
    fs.writeFileSync(DATA_FILE, text, 'utf-8')
}

/**
 * @param {string} guildId
 * @returns {Object}
 */
function getGuildData(guildId) {
    const guilds = getData().guilds
    if (!guilds) return {}
    return guilds[guildId] ?? {}
}

/**
 * @param {string} guildId
 * @param {Object} data
 */
function writeGuildData(guildId, data) {
    const guilds = getData().guilds ?? {}
    guilds[guildId] = data
    writeData({ ...getData(), guilds })
}

/**
 * @typedef {(import('discord.js').NewsChannel | import('discord.js').TextChannel)} AnnounceChannel
 */

/**
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<AnnounceChannel | undefined>}
 */
async function getAnnouncementChannel(guild) {
    const data = getGuildData(guild.id)
    if (!data.announceChannel) return undefined

    const botMember = await guild.members.fetchMe()
    const botPermissions = botMember.permissions
    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) return undefined

    const channel = await guild.channels.fetch(data.announceChannel)
    if (channel?.isSendable()) {
        return /** @type {AnnounceChannel}*/ (/** @type {unknown}*/ (channel))
    } else return undefined
}

/**
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').Role | undefined>}
 */
async function getResponsibleRole(guild) {
    const data = getGuildData(guild.id)
    if (!data.responsibleRole) return undefined
    const role = await guild.roles.fetch(data.responsibleRole)

    if (!role) return undefined
    if (!canUseRole(guild, role)) return undefined

    return role
}

/**
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').Role} role
 * @returns {Promise<boolean>}
 */
async function canUseRole(guild, role) {
    const botMember = await guild.members.fetchMe()
    const botRole = botMember.roles.highest
    const botPermissions = botMember.permissions

    if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) return false
    if (botRole.position - role.position <= 0) return false
    if (role.managed) return false

    return true
}

/**
 *
 * @param {import('discord.js').Guild} guild
 * @returns {{[id: string]: string}}
 */
function getDiscoveredReactions(guild) {
    const data = getGuildData(guild.id)
    return data?.discoveredReactions ?? {}
}

/**
 * Get who discovered a reaction
 * @param {import('discord.js').Guild} guild
 * @param {string} id
 * @returns {Promise<import('discord.js').GuildMember|undefined>} Get the guild member who discovered the reaction
 */
async function getReactionDiscoveredBy(guild, id) {
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
 * @param {string} guildId
 * @param {string} id
 * @param {string|undefined} userId
 */
function setReactionDiscoveredBy(guildId, id, userId) {
    const data = getGuildData(guildId)
    const discovered = data?.discoveredReactions ?? {}
    discovered[id] = userId
    data.discoveredReactions = discovered
    writeGuildData(guildId, data)
}

/**
 * Get the channels that should not be reacted in
 * @param {string} guildId
 * @returns {Set<string>} the set of channel ids that should not be reacted in
 */
function getNoReactChannels(guildId) {
    const data = getGuildData(guildId)
    const noReactChannels = data?.noReactChannels ?? []
    return new Set(noReactChannels)
}

/**
 * Set the channels that should not be reacted in
 * @param {string} guildId
 * @param {Iterable<string>} channelIds the set of channel ids that should not be reacted in
 */
function setNoReactChannels(guildId, channelIds) {
    const data = getGuildData(guildId)
    data.noReactChannels = Array.from(channelIds)
    writeGuildData(guildId, data)
}

/**
 * @typedef {{
 *   days: {
 *     [day: number]: string[]
 *   },
 *   muted: string[]
 * }} ReminderData
 */

/**
 * Get the reminder-related data for a guild
 * @param {string} guildId
 * @returns {ReminderData} The reminder-related data
 */
function getReminderData(guildId) {
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
    reminderData.days = Object.fromEntries(
        Object.entries(reminderData.days) //
            .map(([day, message]) => [parseInt(day), message])
    )

    return reminderData
}

/**
 *
 * @param {string} guildId
 * @param {ReminderData} reminderData
 */
function setReminderData(guildId, reminderData) {
    // Convert days to strings
    const newReminderData = {
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
 * @param {string} guildId The ID of the guild to add the reminder to
 * @param {number} day Which day of the responsibility week the reminder should
 * be sent on. Note that this is not the same as the weekday: 1 means the first
 * day of the responsibility week regardless of whether the responsibility week
 * starts on a Monday or Tuesday
 * @param {string} message What the reminder is for
 */
function addReminder(guildId, day, message) {
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
 * @param {string} guildId The ID of the guild to remove the reminder from
 * @param {number} day Which day to remove a reminder from
 * @param {number} index Which reminder to remove from the list of reminders for that day
 */
function removeReminder(guildId, day, index) {
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

/**
 *
 * @param {string} guildId
 * @param {string} userId
 */
function addReminderMutedUser(guildId, userId) {
    const data = getReminderData(guildId)
    if (data.muted.includes(userId)) {
        throw 'Du får redan inte påminnelser'
    } else {
        data.muted.push(userId)
    }
    setReminderData(guildId, data)
}

function removeReminderMutedUser(guildId, userId) {
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
 *
 * @param {string} guildId
 * @returns {string[]} The IDs of users who are muted for reminders
 */
function getReminderMutedUsers(guildId) {
    const data = getReminderData(guildId)
    return data.muted
}

module.exports = {
    getGuildData,
    writeGuildData,
    getAnnouncementChannel,
    getResponsibleRole,
    canUseRole,
    getDiscoveredReactions,
    getReactionDiscoveredBy,
    setReactionDiscoveredBy,
    getNoReactChannels,
    setNoReactChannels,
    getReminderData,
    addReminder,
    removeReminder,
    addReminderMutedUser,
    removeReminderMutedUser,
}
