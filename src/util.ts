import type { Guild, GuildMember } from 'discord.js'

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param timeString The time as a string such as "09:00"
 * @param after Time to start from
 */
export function getNextTime(
    timeString: string,
    after: number = Date.now()
): Date {
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

/** Get a user in a guild from their nick */
export async function getUser(
    guild: Guild,
    nick: string
): Promise<GuildMember | undefined> {
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

export function getUsers(
    nicks: string[],
    guild: Guild
): Promise<Array<[string, GuildMember | undefined]>> {
    return Promise.all(
        nicks.map(async name => [name, await getUser(guild, name)])
    )
}
