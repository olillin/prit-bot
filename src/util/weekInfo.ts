import { ONE_DAY_MS, ONE_HOUR_MS, parseCalendar, type Calendar, type CalendarEvent } from 'iamcal'
import { getGuildConfiguration } from '../data'

export function getCalendar(guildId: string): Promise<Calendar | undefined> {
    return new Promise(resolve => {
        const configuration = getGuildConfiguration(guildId)
        const url = configuration.responsibleCalendarUrl

        if (!url) {
            resolve(undefined)
        } else {
            fetch(url)
                .then(response => response.text())
                .then(text => {
                    resolve(parseCalendar(text))
                })
        }
    })
}

/**
 * Get the calendar event for the current responsible week. To be detected the
 * event must be a full day event, a week long and contain the word 'ansvar'
 * (case-insensitive).
 * @param guildId The ID of the guild which has the calendar
 * @param summaryPattern A regex pattern to match the event summary
 * @returns The calendar event representing the responsibility week, or undefined if no matching events were found
 * @throws If the calendar was unable to be fetched
 */
export async function getCurrentResponsibleEvent(
    guildId: string,
    summaryPattern: RegExp | undefined = /ansvar/i
): Promise<CalendarEvent | undefined> {
    const calendar = await getCalendar(guildId)
    if (!calendar) throw new Error('Failed to fetch the calendar')

    const now = new Date().getTime()

    return calendar.getEvents().find(event => {
        const start = event.getStart()
        const end = event.getEnd()

        // Check if the event is a whole-day event
        if (!start.isFullDay() || !end?.isFullDay()) return false

        // Check if the event is ongoing
        const startTimeMs = start.getDate().getTime()
        const endTimeMs = end.getDate().getTime()

        const isOngoing = startTimeMs <= now && now <= endTimeMs
        if (!isOngoing) return false

        // Check duration
        const durationMs = endTimeMs - startTimeMs
        const isWeekLong = Math.abs(durationMs - 7 * ONE_DAY_MS) <= ONE_HOUR_MS
        if (!isWeekLong) return false

        // Check summary
        if (summaryPattern) {
            const summary = event.getSummary()
            if (summary === undefined) return false
            const matchesSummary = summaryPattern.test(summary)
            if (!matchesSummary) return false
        }

        return true
    })
}

/**
 * @returns The people who are currently responsible
 */
export async function getCurrentlyResponsible(
    guildId: string
): Promise<string[] | undefined> {
    const event = await getCurrentResponsibleEvent(guildId)

    if (!event) return undefined

    const extractNicks = /(?<=[\s,]|^)(?:(?!ansvar)[^,\n])+(?=[\s,]|$)/gi
    const match = event.getSummary()?.matchAll(extractNicks)
    if (match === undefined) return undefined

    return Array.of(...match).map(m => m[0].trim())
}

/**
 * @returns The day of the responsibility week, starting at 1
 */
export function getDayOfResponsibilityWeek(guildId: string): number {
    const today = new Date()
    return today.getDay()
}

export function scrapeWeek(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fetch(url).then(async response => {
            const text = await response.text()

            const pattern = /<time.{0,30}>(.+?)<\/time>/
            const match = text.match(pattern)

            if (match) {
                resolve(match[1])
            } else {
                reject(`Invalid response from ${url}`)
            }
        })
    })
}

export async function getWeek(): Promise<string | null> {
    return new Promise(resolve => {
        scrapeWeek('https://vecka.nu')
            .then(resolve)
            .catch(e => {
                console.error(e)
                resolve(null)
            })
    })
}

export async function getStudyWeek(): Promise<string | null> {
    return new Promise(resolve => {
        scrapeWeek('https://läsvecka.nu')
            .then(resolve)
            .catch(() => resolve(null))
    })
}
