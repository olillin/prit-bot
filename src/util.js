async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {string} timeString The time as a string such as "09:00"
 * @param {number} [after=Date.now()] Time to start from
 * @returns {Date}
 */
function getNextTime(timeString, after = Date.now()) {
    const parts = timeString.split(':').map(Number)
    if (parts.length > 4) {
        throw new Error('Invalid time string, too many parts')
    } else if (parts.length === 0) {
        throw new Error('Invalid time string, too many parts')
    }

    let time = 0
    const ONE_HOUR = 60 * 60 * 1000
    parts.forEach((part, index) => {
        const msIndex = 3
        if (index < msIndex) {
            time += (ONE_HOUR * part) / 60 ** index
        } else {
            time += part
        }
    })

    const ONE_DAY = 24 * ONE_HOUR
    const afterDay = after - (after % ONE_DAY) // Remove time part of after
    const next = afterDay + time
    if (next < after) {
        return new Date(next + ONE_DAY)
    }
    return new Date(next)
}

/**
 * Get a user in a guild from their nick
 * @param {import('discord.js').Guild} guild
 * @param {string} nick
 * @returns {Promise<import('discord.js').GuildMember|undefined>}
 */
async function getUser(guild, nick) {
    const members = await guild.members.fetch()
    for (const [, member] of members) {
        const discordNickname = (
            member.nickname ?? member.user.displayName
        ).toLowerCase()
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
    return /** @type {Promise<Array<[string, import('discord.js').GuildMember | undefined]>>} */ (
        /** @type {unknown} */ (
            Promise.all(
                nicks.map(async name => [name, await getUser(guild, name)])
            )
        )
    )
}

module.exports = { sleep, getNextTime, getUser, getUsers }
