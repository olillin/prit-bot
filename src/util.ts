import type { Guild, GuildMember } from 'discord.js'
import type { CommandDefinition } from './types'

export const ONE_HOUR = 60 * 60 * 1000

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Split a time string into it's parts
 * 
 * @param timeString A time of the day as a string such as "09:00:00.123" or "15:00"
 * @returns The parts of the time string: hours, minutes, seconds, milliseconds where the parts after hours are optional. Parts may not be skipped
 * @throws If the time string is invalid
 */
export function splitTimeString(timeString: string): number[] {
    const parts = timeString.split(/[:.]/).map(x => parseInt(x, 10))

    // Validate parts count
    if (parts.length > 4) {
        throw new Error('Invalid time string, too many parts')
    } else if (parts.length === 0) {
        throw new Error('Invalid time string, no parts found')
    }

    // Validate integers
    if (parts.filter(x => isNaN(x)).length > 0) {
        throw new Error('Invalid time string, parts must be integers')
    }

    // Validate ranges
    if (parts[0] > 23 || parts[0] < 0) {
        throw new Error('Invalid time string, hours part must be between 0 and 23')
    }
    if (parts.length >= 2 && (parts[1] > 59 || parts[1] < 0)) {
        throw new Error('Invalid time string, minutes part must be between 0 and 59')
    }
    if (parts.length >= 3 && (parts[2] > 59 || parts[2] < 0)) {
        throw new Error('Invalid time string, seconds part must be between 0 and 59')
    }
    if (parts.length == 4 && (parts[3] > 999 || parts[3] < 0)) {
        throw new Error('Invalid time string, milliseconds part must be between 0 and 999')
    }

    return parts
}

/**
 * Get the milliseconds since midnight for a given time string
 * @param timeString A time of the day as a string such as "09:00:00.123" or "09:00"
 */
export function timeStringToMilliseconds(timeString: string): number {
    const parts = splitTimeString(timeString)

    let time = 0
    parts.forEach((part, index) => {
        const msIndex = 3
        if (index < msIndex) {
            time += (ONE_HOUR * part) / 60 ** index
        } else {
            time += part
        }
    })

    return time
}

/**
 * @param timeString The time as a string such as "09:00"
 * @param after Time to get next time after as a timestamp, defaults to now
 */
export function getNextTime(
    timeString: string,
    after: number = Date.now()
): Date {
    const time = timeStringToMilliseconds(timeString)

    const ONE_DAY = 24 * ONE_HOUR
    const afterDay = after - (after % ONE_DAY) // Remove time part of after
    const next = afterDay + time
    if (next < after) {
        return new Date(next + ONE_DAY)
    }
    return new Date(next)
}

export async function schedule(time: Date, callback: () => void): Promise<void> {
    if (isNaN(time.getTime())) {
        throw new Error('Invalid time provided')
    }

    return new Promise((resolve, reject) => {
        const now = Date.now()
        const timeUntil = time.getTime() - now
        if (timeUntil < 0) {
            reject(new Error('Time is in the past'))
            return
        }

        setTimeout(() => {
            try {
                callback()
                resolve()
            } catch (error) {
                reject(error)
            }
        }, timeUntil)
    })
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

export function defineCommand<T extends CommandDefinition>(commandData: T): T {
    return commandData
}