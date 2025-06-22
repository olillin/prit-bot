export const ONE_HOUR_MS = 60 * 60 * 1000
export const ONE_DAY_MS = 24 * ONE_HOUR_MS

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
            time += (ONE_HOUR_MS * part) / 60 ** index
        } else {
            time += part
        }
    })

    return time
}

export function atMidnight(time: Date): Date {
    const midnight = new Date(time)
    midnight.setHours(0, 0, 0, 0)
    return midnight
}

export function millisecondsAtMidnightWithTimezone(time: Date): number {
    const timezoneOffsetMs = time.getTimezoneOffset() * 60 * 1000
    // Time at midnight with timezone offset
    return atMidnight(time).getTime() + timezoneOffsetMs
}

/**
 * @param timeString The time as a string such as "09:00"
 * @param after Time to get next time after as a timestamp, defaults to now
 */
export function getNextTime(
    timeString: string,
    after: Date = new Date()
): Date {
    const time = timeStringToMilliseconds(timeString)

    const afterTimeMs = after.getTime()
    // Time at midnight with timezone offset
    const afterDay = millisecondsAtMidnightWithTimezone(after)
    const nextTimeMs = afterDay + time

    const dayOffset = Math.max(0, Math.ceil((afterTimeMs - nextTimeMs) / ONE_DAY_MS))
    return new Date(nextTimeMs + ONE_DAY_MS * dayOffset)
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

export type DiscordTimeStampMode = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'
export function toDiscordTimestamp(time: Date, mode?: DiscordTimeStampMode): string {
    return `<t:${time.getTime() / 1000}${mode ? `:${mode}` : ''}>`
}