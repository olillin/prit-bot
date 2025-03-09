// @ts-ignore
const { getAnnouncementChannel, getResponsibleRole } = require('./data')
const { getWeek, getStudyWeek, getCurrentlyResponsible } = require('./weekInfo')

/**
 * Get a user in a guild from their nick
 * @param {import('discord.js').Guild} guild
 * @param {string} nick
 * @returns {Promise<import('discord.js').GuildMember|undefined>}
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
 * @param {import('discord.js').Guild} guild
 * @returns Promise<Array<[string, GuildMember | undefined]>>
 */
/**
 * @param {string[]} nicks
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<Array<[string, import('discord.js').GuildMember | undefined]>>}
 */
function getUsers(nicks, guild) {
    return /** @type {Promise<Array<[string, import('discord.js').GuildMember | undefined]>>} */ (/** @type {unknown} */ (Promise.all(nicks.map(async name => [name, await getUser(guild, name)]))))
}

/**
 * Announce info this week in a guild
 * @param {import('discord.js').Guild} guild Guild to announce week for
 * @returns {Promise<boolean>} If the announcement was successful
 */
async function announceWeekIn(guild) {
    const week = await getStudyWeek()
    if (!week) {
        console.error(`Could not make announcement, week returned ${week}`)
        return false
    }

    const responsible = await getCurrentlyResponsible(guild)

    const announceChannel = await getAnnouncementChannel(guild)
    if (!announceChannel) {
        console.warn("Didn't make announcement in ${guild}, no channel set")
        return false
    }

    let responsibleLine = ''
    if (responsible) {
        const users = await getUsers(responsible, guild)
        const stringUsers = users.map(([name, user]) => user?.toString() ?? `@${name}`)

        /** @type {string} */
        let userList = ''
        if (stringUsers.length <= 1) {
            userList = stringUsers.join()
        } else {
            const last = stringUsers.pop()
            userList = stringUsers.join(', ') + ' och ' + last
        }

        responsibleLine = `${week} har ${userList} ansvarsvecka, gör ert bästa men slit inte ut er! <:pixelnheart:1318195394781384714>`

        assignRole(guild, users)
    } else {
        responsibleLine = `${week} gick det inte att hitta någon ansvarsvecka för :thinking:`
    }

    announceChannel.send(
        `### Det är en ny vecka!
${responsibleLine}`
    )

    return true
}

/**
 * Announce info this week in all guilds
imClient} client
 * @returns {Promise<boolean>} If any announcement was successful
 */
async function announceWeek(client) {
    const guilds = await client.guilds.fetch()
    const promises = guilds.map(async guild => announceWeekIn(await guild.fetch()))
    const success = (await Promise.all(promises)).some(x => x)
    return success
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {Array<[string, import('discord.js').GuildMember | undefined]>} users
 */
async function assignRole(guild, users) {
    const role = await getResponsibleRole(guild)
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
let previousWeek
/**
 * @param {import('discord.js').Client} client
 * @returns {Promise<never>}
 */
// @ts-ignore
async function waitForWeekStart(client) {
    // @ts-ignore
    previousWeek = await getWeek()
    while (true) {
        const nowWeek = await getWeek()
        if (nowWeek && nowWeek !== previousWeek) {
            await announceWeek(client)

            previousWeek = nowWeek
        }

        await sleep(60 * 1000) // Wait 1 minute
    }
}

module.exports = { getUser, announceWeekIn, announceWeek, waitForWeekStart }
