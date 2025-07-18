import type { Calendar, CalendarEvent } from 'iamcal'
import { parseCalendar } from 'iamcal/parse'
import { getGuildConfiguration } from '../data'
import { ONE_WEEK } from './dates'

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
 * Get the calendar event for the current responsible week
 * @param guildId The ID of the guild which has the calendar
 * @param summaryPattern A regex pattern to match the event summary
 */
export async function getCurrentResponsibleEvent(
    guildId: string,
    summaryPattern: RegExp | undefined = /ansvar/i
): Promise<CalendarEvent | undefined> {
    const calendar = await getCalendar(guildId)
    if (!calendar) return undefined

    const now = new Date().getTime()

    return calendar.events().find(event => {
        // Check if the event is a whole-day event
        if (!event.getPropertyParams('DTSTART')?.includes('VALUE=DATE')) return false
        if (!event.getPropertyParams('DTEND')?.includes('VALUE=DATE')) return false

        // Check if the event is ongoing
        const startTime = event.start().getTime()
        const endTime = event.end().getTime()

        const isOngoing = startTime <= now && now <= endTime
        if (!isOngoing) return false

        // Check duration
        const duration = endTime - startTime
        const isWeekLong = duration === ONE_WEEK
        if (!isWeekLong) return false

        // Check summary
        if (summaryPattern) {
            const matchesSummary = summaryPattern.test(event.summary())
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
    const match = event.summary().matchAll(extractNicks)
    return Array.of(...match).map(m => m[0].trim())
}

/**
 * @returns The day of the responsibility week, starting at 1
 */
export function getDayOfResponsibilityWeek(
    guildId: string
): number {
    const today = new Date()
    return today.getDay()
}

export function fetchText(url: string): Promise<string> {
    return fetch(url).then(async response => response.text())
}

export async function getStudyWeek(): Promise<string | null> {
    return new Promise(resolve => {
        fetchText('https://läsvecka.nu/data')
            .then(resolve)
            .catch(() => resolve(null))
    })
}
