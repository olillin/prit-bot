import * as bookit from 'bookit-scraper'
import * as data from '../data.js'
import { gammaPassword, gammaUsername } from '../environment.js'
import type { BookITEvent, BookITEventsFTResponse } from '../types.js'
import { atMidnight, ONE_DAY_MS } from '../util/dates.js'

async function createCookie(): Promise<string> {
    // Return saved cookie if possible
    const savedCookie = data.getBookITCookie()
    if (savedCookie && !isCookieExpired(savedCookie)) {
        return savedCookie
    }

    // Generate new cookie
    console.log('Generating new BookIT cookie...')
    if (gammaUsername && gammaPassword) {
        const cookie = await bookit.createCookie(gammaUsername, gammaPassword)
        data.setBookITCookie(cookie)
        return cookie
    } else {
        data.setBookITCookie(undefined)
        throw new Error('Unable to create BookIT cookie, missing Gamma credentials')
    }
}

export function getEventsToday(): Promise<BookITEvent[]> {
    const dayStart = atMidnight(new Date())
    const dayEnd = new Date(dayStart.getTime() + ONE_DAY_MS)

    return createCookie()
        .then(cookie => {
            console.log('Using cookie:', cookie)
            const client = bookit.createGraphQLClient(cookie)
            return client.request(`{
                eventsFT(
                    from: "${dayStart.toISOString()}"
                    to: "${dayEnd.toISOString()}"
                ) {
                    id
                    title
                    room
                    start
                    end
                    booked_by
                    booked_as
                }
            }`)
        })
        .then(response => {
            return (response as BookITEventsFTResponse).eventsFT
                .map(event => ({
                    id: event.id!,
                    title: event.title!,
                    room: event.room!.map(translateRoom),
                    start: new Date(parseInt(event.start!)),
                    end: new Date(parseInt(event.end!)),
                    bookedBy: event.booked_by!,
                    bookedAs: event.booked_as!,
                } as BookITEvent))
        })
        .catch(error => {
            console.error('Error fetching BookIT events:', error)
            throw error
        })
}

/**
 * Get the Swedish name of a room in Hubben from its BookIT name
 * @param room The name of the room from BookIT
 * @returns The Swedish name of the room, or the same name if no translation is found
*/
export function translateRoom(room: string): string {
    const translations: { [_: string]: string } = {
        'BIG_HUB': 'Storhubben',
        'GROUP_ROOM': 'Grupprummet',
        'CTC': 'CTC',
        'The Cloud': 'The Cloud',
    }
    return translations[room] || room
}

export function isCookieExpired(cookie: string): boolean {
    const now = new Date()
    const attributes = cookie.split(';').map(attr => attr.trim())

    for (const attribute of attributes) {
        if (attribute.startsWith('Expires=')) {
            const expiry = new Date(attribute.split('=')[1])
            const expired = expiry <= now
            return expired
        }
    }
    // No expiration means it is a session cookie, which expires when the browser is closed
    return true
}