const { parseCalendar } = require('iamcal/parse')
const { getGuildData } = require('./data')

/**
 * @param {string} guildId
 * @returns {Promise<import('iamcal').Calendar|undefined>}
 */
function getCalendar(guildId) {
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

/**
 * Parse a date string in the format YYYYMMDD, required because of a bug in 'iamcal'
 * @param {string} value
 * @returns {Date}
 */
function parseDate(value) {
    return new Date(
        parseInt(value.substring(0, 4)), //
        parseInt(value.substring(4, 6)) - 1,
        parseInt(value.substring(6, 8))
    )
}

/**
 * Get the calendar event for the current responsible week
 * @param {string} guildId
 * @returns {Promise<import('iamcal').CalendarEvent|undefined>}
 */

async function getCurrentResponsibleEvent(guildId) {
    const calendar = await getCalendar(guildId)
    if (!calendar) return undefined

    const now = new Date().getTime()

    const dayInMs = 24 * 60 * 60 * 1000

    return calendar.events().find(event => {
        // @ts-ignore
        const start = event.getProperty('DTSTART').value
        // @ts-ignore
        const end = event.getProperty('DTEND').value

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
 * @param {string} guildId
 * @returns {Promise<string[]|undefined>} The people who are currently responsible
 */
async function getCurrentlyResponsible(guildId) {
    const event = await getCurrentResponsibleEvent(guildId)

    if (!event) return undefined

    const extractNicks = /\b[^,\n]+\b/g
    const match = event.summary().matchAll(extractNicks)
    return Array.of(...match).map(m => m[0])
}

/**
 * @param {Date} date
 * @returns {Date}
 */
function toStartOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 *
 * @param {string} guildId
 * @returns {Promise<number>} The day of the responsibility week, starting at 1
 */
async function getDayOfResponsibilityWeek(guildId) {
    const today = toStartOfDay(new Date())
    const ONE_DAY_MS = 1000 * 60 * 60 * 24
    const day = Math.floor(today.getTime() / ONE_DAY_MS)

    const event = await getCurrentResponsibleEvent(guildId)
    if (!event) {
        throw new Error('No current responsible event found')
    }
    // @ts-ignore
    const start = parseDate(event.getProperty('DTSTART').value)
    const startDay = Math.floor(start.getTime() / ONE_DAY_MS)

    return day - startDay + 1
}

/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
function scrapeWeek(url) {
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

/**
 * @returns {Promise<string | null>}
 */
async function getWeek() {
    return new Promise(resolve => {
        scrapeWeek('https://vecka.nu')
            .then(resolve)
            .catch(e => {
                console.error(e)
                resolve(null)
            })
    })
}

/**
 * @returns {Promise<string | null>}
 */
async function getStudyWeek() {
    return new Promise(resolve => {
        scrapeWeek('https://läsvecka.nu')
            .then(resolve)
            .catch(() => resolve(null))
    })
}

module.exports = {
    getCurrentResponsibleEvent,
    getDayOfResponsibilityWeek,
    getCurrentlyResponsible,
    getWeek,
    getStudyWeek,
    parseDate,
}
