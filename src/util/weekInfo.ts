import type { Calendar, CalendarEvent } from 'iamcal'
import { parseCalendar } from 'iamcal/parse'
import { getGuildData } from '../data'

export function getCalendar(guildId: string): Promise<Calendar | undefined> {
    return new Promise(resolve => {
        const data = getGuildData(guildId)
        const url = data.responsibleCalendarUrl

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

/** Parse a date string in the format YYYYMMDD, required because of a bug in 'iamcal' */
export function parseDate(value: string): Date {
    return new Date(
        parseInt(value.substring(0, 4)), //
        parseInt(value.substring(4, 6)) - 1,
        parseInt(value.substring(6, 8))
    )
}

/** Get the calendar event for the current responsible week */
export async function getCurrentResponsibleEvent(
    guildId: string
): Promise<CalendarEvent | undefined> {
    const calendar = await getCalendar(guildId)
    if (!calendar) return undefined

    const now = new Date().getTime()

    const dayInMs = 24 * 60 * 60 * 1000

    return calendar.events().find(event => {
        const start = event.getProperty('DTSTART')!.value
        const end = event.getProperty('DTEND')!.value

        if (!isNaN(new Date(start).getTime())) return false
        if (!isNaN(new Date(end).getTime())) return false

        const startDate = parseDate(start)
        const startTime = startDate.getTime()
        const endDate = parseDate(end)
        const endTime = endDate.getTime()

        const isOngoing = startTime <= now && now <= endTime

        const duration = endTime - startTime
        const isWeekLong = duration > 6 * dayInMs && duration < 8 * dayInMs

        return isOngoing && isWeekLong
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

    const extractNicks = /\b[^,\n]+\b/g
    const match = event.summary().matchAll(extractNicks)
    return Array.of(...match).map(m => m[0])
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
