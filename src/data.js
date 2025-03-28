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
async function setReactionDiscoveredBy(guildId, id, userId) {
    const data = getGuildData(guildId)
    const discovered = data?.discoveredReactions ?? {}
    discovered[id] = userId
    data.discoveredReactions = discovered
    writeGuildData(guildId, data)
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
}
