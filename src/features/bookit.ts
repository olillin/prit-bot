const { createCookie, createGraphQLClient } = await import('bookit-scraper')
import { gammaPassword, gammaUsername } from '../environment'
import { atMidnight, ONE_DAY_MS } from '../util/dates'

async function createCookie(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (gammaUsername && gammaPassword) {
            resolve(bookit.createCookie(gammaUsername, gammaPassword))
        } else {
            reject('Unable to create BookIT cookie, missing Gamma credentials')
        }
    })
}

export function getEventsToday() {
    const dayStart = atMidnight(new Date())
    const dayEnd = new Date(dayStart.getTime() + ONE_DAY_MS)

    return createCookie()
        .then(cookie => {
            const client = bookit.createGraphQLClient(cookie)
            return client.request(`
                eventsFT(
                    from: ${dayStart.toISOString()}
                    to: ${dayEnd.toISOString()}
                ) {
                    id
                    title
                    room
                    start
                    end
                }
            `)
        })
        .catch(error => {
            console.error('Error fetching BookIT events:', error)
            throw error
        })
}