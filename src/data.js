const { Client, NewsChannel, TextChannel, Role, Guild, PermissionsBitField, PermissionFlagsBits } = require('discord.js')
const fs = require('fs')

const DATA_FILE = 'data.json'

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}))
}

function getData() {
    const text = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(text)
    return parsed
}

function writeData(data) {
    const text = JSON.stringify(data)
    fs.writeFileSync(DATA_FILE, text, 'utf-8')
}

/**
 * @typedef {(NewsChannel | TextChannel)} AnnounceChannel
 */

/**
 * @param {Client} client
 * @returns {Promise<AnnounceChannel | undefined>}
 */
async function getAnnouncementChannel(client) {
    const data = getData()
    if (!data.announceGuild || !data.announceChannel) return undefined
    const guild = await client.guilds.fetch(data.announceGuild)

    const botMember = await guild.members.fetchMe()
    const botPermissions = botMember.permissions
    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) return undefined

    const channel = await guild.channels.fetch(data.announceChannel)
    if (channel?.isSendable()) {
        return /** @type {AnnounceChannel}*/ (/** @type {unknown}*/ (channel))
    } else return undefined
}

/**
 * @param {Client} client
 * @returns {Promise<Role | undefined>}
 */
async function getAnsvarRole(client) {
    const data = getData()
    if (!data.ansvarRole) return undefined
    const guild = await client.guilds.fetch(data.announceGuild)
    const role = await guild.roles.fetch(data.ansvarRole)

    if (!role) return undefined
    if (!canUseRole(guild, role)) return undefined

    return role
}

/**
 *
 * @param {Guild} guild
 * @param {Role} role
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

module.exports = { getData, writeData, getAnnouncementChannel, getAnsvarRole, canUseRole }
