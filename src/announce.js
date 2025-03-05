// @ts-ignore
const { Guild, GuildMember, Client, VoiceChannel, NewsChannel, StageChannel, TextChannel, GuildChannel } = require('discord.js')
const { getData } = require('./data')
const { lasVecka, ansvarsVecka } = require('./weekInfo')

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
    const channel = await guild.channels.fetch(data.announceChannel)
    if (channel?.isSendable()) {
        return /** @type {AnnounceChannel}*/ (/** @type {unknown}*/ (channel))
    } else return undefined
}

/**
 * Get a user in a guild from their nick
 * @param {Guild} guild
 * @param {string} nick
 * @returns {Promise<GuildMember|undefined>}
 */
async function getUser(guild, nick) {
    const members = await guild.members.fetch()
    for (const [, member] of members) {
        const discordNickname = (member.nickname ?? member.user.displayName).toLowerCase()
        if (discordNickname.includes(nick.toLowerCase())) {
            return member
        }
    }
}

/**
 * Announce info this week
 * @param {Client} client
 * @returns {Promise<boolean>} If the announcement was successful
 */
async function announceWeek(client) {
    const announceChannel = await getAnnouncementChannel(client)
    if (!announceChannel) {
        console.warn("Didn't make announcement, no channel set")
        return false
    }

    const week = await lasVecka()
    if (!week) {
        console.error(`Could not make announcement, week returned ${week}`)
        return false
    }

    const ansvar = await ansvarsVecka()
    let ansvarLine = ''
    if (ansvar) {
        const users = /** @type {Array<[string, GuildMember | undefined]>} */ (/** @type {unknown} */ (await Promise.all(ansvar.map(async name => [name, await getUser(announceChannel.guild, name)]))))
        const stringUsers = users.map(([name, user]) => user?.toString() ?? `@${name}`)

        /** @type {string} */
        let userList = ''
        if (stringUsers.length <= 1) {
            userList = stringUsers.join()
        } else {
            const last = stringUsers.pop()
            userList = stringUsers.join(', ') + ' och ' + last
        }

        ansvarLine = `${week} har ${userList} ansvarsvecka, gör ert bästa men slit inte ut er! :pixelnheart:`
    } else {
        ansvarLine = `${week} gick det inte att hitta någon ansvarsvecka för :thinking:`
    }

    announceChannel.send(
        `### Det är en ny vecka!
${ansvarLine}`
    )

    return true
}

/**
 * Returns after a set time
 * @param {number} ms
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// @ts-ignore
Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1)
    // @ts-ignore
    return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7)
}

/** @type {number} */
let currentWeek
/**
 * @param {Client} client
 * @returns {Promise<never>}
 */
// @ts-ignore
async function waitForWeekStart(client) {
    // @ts-ignore
    currentWeek = new Date().getWeek()
    while (true) {
        // @ts-ignore
        const nowWeek = new Date().getWeek()
        if (nowWeek !== currentWeek) {
            await announceWeek(client)
            currentWeek = nowWeek
        }

        await sleep(60 * 1000) // Wait 1 minute
        console.log('Week:', currentWeek)
    }
}

module.exports = { getAnnouncementChannel, getUser, announceWeek, waitForWeekStart }
