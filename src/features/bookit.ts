import * as bookit from 'bookit-scraper'
import { ActionRowBuilder, BaseMessageOptions, ButtonBuilder, ButtonInteraction, ButtonStyle, Embed, EmbedBuilder, Guild } from 'discord.js'
import * as data from '../data.js'
import { gammaPassword, gammaUsername } from '../environment.js'
import { EMBED_COLOR_BOOKIT } from '../theme.js'
import type { BookITEvent, BookITEventResponse, BookITEventsFTResponse, Concrete } from '../types.js'
import { atMidnight, ONE_DAY_MS, toDiscordTimestamp } from '../util/dates.js'

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

export function getEventsFT(from: Date, to: Date, excludeTheCloud: boolean = true): Promise<BookITEvent[]> {
    return createCookie()
        .then(cookie => {
            const client = bookit.createGraphQLClient(cookie)
            return client.request(`{
                eventsFT(
                    from: "${from.toISOString()}"
                    to: "${to.toISOString()}"
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
                .filter(event => !excludeTheCloud || (event.room!.length !== 1 || event.room![0] !== 'THE_CLOUD'))
                .map(event => ({
                    id: event.id!,
                    title: event.title!,
                    room: event.room!.map(bookit.translateRoom),
                    start: new Date(parseInt(event.start!)),
                    end: new Date(parseInt(event.end!)),
                    bookedBy: event.booked_by!,
                    bookedAs: bookit.translateGroup(event.booked_as!),
                } as BookITEvent))
        })
        .catch(error => {
            console.error('Error fetching BookIT events:', error)
            throw error
        })
}

export function getEventsToday(excludeTheCloud: boolean = true): Promise<BookITEvent[]> {
    const dayStart = atMidnight(new Date())
    const dayEnd = new Date(dayStart.getTime() + ONE_DAY_MS)

    return getEventsFT(dayStart, dayEnd, excludeTheCloud)
}

export function getFutureEvents(count: number, excludeTheCloud: boolean = true): Promise<BookITEvent[]> {
    const from = new Date()
    const to = new Date(from.getTime() + 14 * ONE_DAY_MS)

    return getEventsFT(from, to, excludeTheCloud)
        .then(events => {
            return events.splice(0, count)
        })
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

export async function getEventDetails(id: string): Promise<Concrete<BookITEvent>> {
    return createCookie()
        .then(cookie => {
            const client = bookit.createGraphQLClient(cookie)
            return client.request(`{
                event(id: "${id}") {
                  id
                  title
                  room
                  start
                  end
                  booked_by
                  booked_as
                  description
                }
            }`)
        })
        .then(response => {
            const event = (response as BookITEventResponse).event
            return {
                id: event.id!,
                title: event.title!,
                room: event.room!.map(bookit.translateRoom),
                start: new Date(parseInt(event.start!)),
                end: new Date(parseInt(event.end!)),
                bookedBy: event.booked_by!,
                bookedAs: bookit.translateGroup(event.booked_as!),
                description: event.description!
            } as Concrete<BookITEvent>
        })
        .catch(error => {
            console.error('Error fetching BookIT event description:', error)
            throw error
        })
}

function createEventSummary(event: BookITEvent) {
    return `
    **Vem:** ${event.bookedBy} som ${event.bookedAs}
    **Rum:** ${event.room.join(', ')}
    **Början:** ${toDiscordTimestamp(event.start, 'F')}
    **Avslut:** ${toDiscordTimestamp(event.end, 'F')}

    ${event.description ?? ''}

    -# ||${event.id}||
    `.trim().replaceAll(/((?:\n\s*)+(?=(?:\n\s*){2})|^ +)/mg, '')
}

function getEventId(summary: string) {
    return summary.match(/\|\|(.+?)\|\|/)![1]
}

export function createEventEmbed(event: BookITEvent): EmbedBuilder {
    return new EmbedBuilder()
        .setAuthor({
            name: 'BookIT',
            url: bookit.BOOKIT_URL,
            iconURL: 'https://www.emoji.family/api/emojis/1f5d3/twemoji/png/64'
        })
        .setTitle(event.title)
        .setDescription(createEventSummary(event))
        .setColor(EMBED_COLOR_BOOKIT)
}

export async function createEventMessage(guild: Guild, event: BookITEvent): Promise<BaseMessageOptions> {
    const responsibleRole = await data.getResponsibleRole(guild)

    const embed = createEventEmbed(event)

    const showMoreButtonComponent = new ButtonBuilder()
        .setCustomId('bookit-show-more')
        .setLabel('Visa mer')
        .setStyle(ButtonStyle.Secondary)

    const actionRowComponent = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(showMoreButtonComponent)

    return {
        ...(responsibleRole && { content: responsibleRole.toString() }),
        embeds: [embed],
        components: [actionRowComponent],
    }
}

export async function expandSummaryMessage(interaction: ButtonInteraction): Promise<void> {
    const eventId = getEventId((interaction.message.embeds[0] as Embed).description!)
    const event = await getEventDetails(eventId)
    const embed = createEventEmbed(event)

    await interaction.update({
        embeds: [embed],
        components: [],
    })
}