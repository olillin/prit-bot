// Messy import because of ESModule and CommonJS interop
import type * as weeknumberTypes from 'weeknumber/types/index' with { 'resolution-mode': 'require' }
let weekNumber: typeof weeknumberTypes.weekNumber = (date?: Date | undefined) => -1
let weeksPerYear: typeof weeknumberTypes.weeksPerYear = (year: number) => -1
    ; (async () => {
        //@ts-ignore
        const weeknumber = await import('weeknumber') as typeof weeknumberTypes
        weekNumber = weeknumber.weekNumber
        weeksPerYear = weeknumber.weeksPerYear
    })()
export { weekNumber, weeksPerYear }

export const ONE_HOUR = 60 * 60 * 1000
export const ONE_DAY = 24 * ONE_HOUR
export const ONE_WEEK = 7 * ONE_DAY

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

/** Returns the same day but at midnight local time. The returned time will be in the past */
export function atMidnight(date: Date): Date {
    const timeMs = date.getTime()
    const midnightMs = timeMs - (timeMs % ONE_DAY)

    return new Date(midnightMs)
}

/** Returns the same day but at midnight UTC. The returned time will be in the past */
export function atMidnightUTC(date: Date): Date {
    const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
    const midnightMs = atMidnight(date).getTime() + timezoneOffsetMs

    return new Date(midnightMs)
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
    const afterDay = atMidnightUTC(after).getTime()
    const nextTimeMs = afterDay + time

    const dayOffset = Math.max(0, Math.ceil((afterTimeMs - nextTimeMs) / ONE_DAY))
    return new Date(nextTimeMs + ONE_DAY * dayOffset)
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

/**
 * Check if a year is a leap year
 * 
 * Credit: https://stackoverflow.com/a/16353241
 */
export function isLeapYear(year: number): boolean {
    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
}

/**
 * Get the amount of days during a year
 */
export function daysPerYear(year: number): 365 | 366 {
    return isLeapYear(year) ? 366 : 365
}

/**
 * Convert an ordinal date and year to a date
 * @param ordinal The day of the year where 1 is January 1st
 * @param year The full year number
 */
export function fromOrdinalDate(ordinal: number, year: number): Date {
    const januaryFirst = new Date(year, 0, 1).getTime()
    const offsetMs = (ordinal - 1) * ONE_DAY
    const time = januaryFirst + offsetMs
    return new Date(time)
}

/**
 * Convert a week number and year to a date
 * Implementation of: https://en.wikipedia.org/wiki/ISO_week_date#Calculating_an_ordinal_or_month_date_from_a_week_date
 */
export function fromWeekDate(week: number, year: number, dayOfTheWeek: number = 1): Date {
    const january4th = new Date(year, 0, 4)
    const january4thWeekDay = (january4th.getDay() + 6) % 7 + 1
    const d = week * 7 + dayOfTheWeek - (january4thWeekDay + 3)
    let ordinal = d
    if (d < 1) {
        ordinal += daysPerYear(year - 1)
        year--
    } else if (d > daysPerYear(year)) {
        ordinal -= daysPerYear(year)
        year++
    }
    return fromOrdinalDate(ordinal, year)
}

/**
 * Get the start of a week from its week number
 * @param week The week number, between 0-53
 * @param backtrack How many weeks into the past to allow, weeks before this will instead return weeks the next year
 */
export function weekToDate(week: number, backtrack: number = 10): Date {
    const now = new Date()
    const currentWeek = weekNumber(now)
    const backtrackMs = ONE_WEEK * backtrack
    const weeksPreviousYear = weeksPerYear(now.getFullYear() - 1)
    const backtrackedWeek = weekNumber(new Date(now.getTime() - backtrackMs)) % weeksPreviousYear

    let year = now.getFullYear()
    if (week < backtrackedWeek) {
        // Week is year after backtrackedWeek
        year = backtrackedWeek > currentWeek ? year : year + 1
    } else if (currentWeek < backtrackedWeek) {
        // Week is previous year
        year--
    } else {
        // Week is this year
    }
    return fromWeekDate(week, year)
}