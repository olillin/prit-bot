const { parseCalendar } = require('iamcal/parse')
const { getGuildData } = require('./data')

/**
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('iamcal').Calendar|undefined>}
 */
function getCalendar(guild) {
    return new Promise(resolve => {
        const data = getGuildData(guild.id)
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
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<string[]|undefined>} The people who are currently responsible
 */
async function getCurrentlyResponsible(guild) {
    const calendar = await getCalendar(guild)
    if (!calendar) return undefined

    const now = new Date().getTime()
    const nickListPattern = /^\s*(\w+)(?:\\?,\s*(\w+))?\s*$/

    const dayInMs = 24 * 60 * 60 * 1000

    const event = calendar.events().find(event => {
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

        const matchesPattern = nickListPattern.test(event.summary())

        return isOngoing && isWeekLong && matchesPattern
    })

    if (!event) return undefined

    const match = event.summary().matchAll(/\w+/g)
    return Array.of(...match).map(m => m[0])
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

module.exports = { getCurrentlyResponsible, getWeek, getStudyWeek }
