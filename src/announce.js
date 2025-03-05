// @ts-ignore
const { Guild, GuildMember, Client } = require('discord.js')
const { getAnnouncementChannel, getAnsvarRole } = require('./data')
const { lasVecka, ansvarsVecka, vecka } = require('./weekInfo')

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
 * @param {string[]} nicks
 * @param {Guild} guild
 * @returns Promise<Array<[string, GuildMember | undefined]>>
 */
function getUsers(nicks, guild) {
    return /** @type {Promise<Array<[string, GuildMember | undefined]>>} */ (/** @type {unknown} */ (Promise.all(nicks.map(async name => [name, await getUser(guild, name)]))))
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
        const users = await getUsers(ansvar, announceChannel.guild)
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

        assignRole(client, announceChannel.guild, users)
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
 * @param {Client} client
 * @param {Guild} guild
 * @param {Array<[string, GuildMember | undefined]>} users
 */
async function assignRole(client, guild, users) {
    const role = await getAnsvarRole(client)
    if (!role) {
        console.warn('Failed to assign roles, could not get role')
        return
    }

    try {
        const members = await guild.members.fetch()

        console.log(`Removing role '${role.name}' from ${members.size} members`)
        await Promise.all(
            members.map(member => {
                if (member?.roles?.cache.some(r => r.id === role.id)) {
                    member.roles.remove(role)
                }
            })
        )

        console.log('Adding role to selected members')
        await Promise.all(
            users.map(async ([nick, user]) => {
                if (user) {
                    await user.roles.add(role)
                    console.info(`Assigned role to ${nick} (${user.nickname ?? user.user.displayName})`)
                } else console.warn(`Failed to assign role to ${nick}, unable to find user`)
            })
        )
    } catch (e) {
        console.error('Failed to assign roles')
        console.error(e)
        console.trace()
    }
}

/**
 * Returns after a set time
 * @param {number} ms
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/** @type {string} */
let currentWeek
/**
 * @param {Client} client
 * @returns {Promise<never>}
 */
// @ts-ignore
async function waitForWeekStart(client) {
    // @ts-ignore
    currentWeek = await vecka()
    while (true) {
        const nowWeek = await vecka()
        if (nowWeek && nowWeek !== currentWeek) {
            await announceWeek(client)

            currentWeek = nowWeek
        }

        await sleep(60 * 1000) // Wait 1 minute
    }
}

module.exports = { getUser, announceWeek, waitForWeekStart }
