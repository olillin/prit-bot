import { EmbedBuilder, type Guild } from 'discord.js'
import {
    getAnnouncementChannel,
    getGuildId,
    getNoPingUsers,
    getReminders,
    getRemindTime,
} from '../data'
import { getNextTime } from '../util/dates'
import { getUsers, PerGuildLoop } from '../util/guild'
import { getResponsibleNicks } from '../util/weekInfo'
import client from '../bot'
import { CommandResponseError } from '../util/command'
import { Reminder, RemindersByDay } from '../types'

/** Get an embed for the reminders today */
export async function getRemindersEmbedToday(
    guild: Guild
): Promise<EmbedBuilder | null> {
    const guildId = await getGuildId(guild.id)
    if (guildId === null) {
        throw new Error('Guild is not in database')
    }
    const reminderData = await getReminders(guildId)
    const weekDay = new Date().getDay()

    const reminders = reminderData[weekDay]
    if (!reminders || reminders.length === 0) {
        return null
    }

    // Title
    const today = new Date()
    const monthString = (today.getMonth() + 1).toString().padStart(2, '0')
    const dayString = today.getDate().toString().padStart(2, '0')
    const dateString = dayString + '/' + monthString

    const title = `Ansvarsvecka Påminnelser ${dateString}`

    // Description
    const description =
        '-# Använd `/reminders` kommandot om du inte vill bli pingad'

    return new EmbedBuilder()
        .setColor('#ffbb00')
        .setTitle(title)
        .setDescription(description)
        .addFields([
            {
                name: 'Att göra',
                value: reminders.map(r => '- ' + r.message).join('\n'),
            },
        ])
}

export async function getRemindersUserLineToday(guild: Guild): Promise<string> {
    const guildId = await getGuildId(guild.id)
    if (guildId === null) {
        throw new Error('Guild is not in database')
    }
    const noPingUsers = await getNoPingUsers(guildId)

    let userLine = ''
    const responsibleNames = await getResponsibleNicks(guildId)
    if (!responsibleNames) {
        throw new CommandResponseError('Det finns ingen ansvarig idag')
    }
    if (responsibleNames) {
        const responsibleUsers = getUsers(responsibleNames, guild)

        const userStrings = responsibleUsers.map(([nick, user]) =>
            user === undefined || noPingUsers.includes(BigInt(user.id))
                ? nick
                : `<@${user.id}>`
        )
        userLine = `-# Påminnelser för: ${userStrings.join(' ')}`
    }

    return userLine
}

export async function announceReminders(guild: Guild) {
    let embed: EmbedBuilder | null
    try {
        embed = await getRemindersEmbedToday(guild)
    } catch (message) {
        if (typeof message === 'string') {
            throw new CommandResponseError(
                `Kunde inte skicka påminnelser: ${message} `
            )
        } else {
            throw new CommandResponseError(
                'Kunde inte skicka påminnelser, ett okänt fel inträffade'
            )
        }
    }
    if (!embed) {
        throw new CommandResponseError(
            'Skickade inte påminnelser, inga påminnelser idag'
        )
    }

    let userLine: string
    try {
        userLine = await getRemindersUserLineToday(guild)
    } catch (message) {
        if (typeof message === 'string') {
            throw new CommandResponseError(
                `Skickade inte skicka påminnelser: ${message} `
            )
        } else {
            throw new CommandResponseError(
                'Kunde inte skicka påminnelser, ett okänt fel inträffade'
            )
        }
    }

    const channel = await getAnnouncementChannel(guild)
    if (!channel) {
        throw new CommandResponseError(
            'Skickade inte påminnelser, ingen kanal angiven'
        )
    }

    try {
        await channel.send({ content: userLine, embeds: [embed] })
    } catch (e) {
        console.error('Failed to send reminders', e)
        throw new CommandResponseError('Misslyckades med att skicka meddelande')
    }
}

/**
 * Collapse reminder ids to a continuous sequence of local ids for the guild.
 * @param reminders All reminders for the guild.
 * @return The same reminders with their ids mapped to local ids starting at 1.
 * @see {@link getOriginalReminder}
 */
export function collapseReminderIds(reminders: RemindersByDay): RemindersByDay {
    const entries = Object.entries(reminders) as unknown as [
        number,
        Reminder[],
    ][]
    const ids = entries
        .flatMap(([_, rs]) => rs.map(r => r.id))
        .sort((a, b) => a - b)

    const mappedEntries = entries.map(
        ([day, rs]) =>
            [
                day,
                rs.map(({ id, message }) => ({
                    id: ids.indexOf(id) + 1,
                    message,
                })),
            ] as const
    )

    return Object.fromEntries(mappedEntries) satisfies RemindersByDay
}

/**
 * Get the original reminder after being processed by collapseReminderIds.
 * @param localId The reminder id from collapseReminderIds.
 * @param reminders All reminders for the guild.
 * @return The original reminder.
 * @see {@link collapseReminderIds}
 */
export function getOriginalReminder(
    localId: number,
    reminders: RemindersByDay
): Reminder | null {
    const flatReminders = Object.values(reminders).flatMap(
        rs => rs as Reminder[]
    )
    flatReminders.sort((a, b) => a.id - b.id)
    return flatReminders[localId - 1] ?? null
}

export const remindersLoop = new PerGuildLoop(
    // getNextTime
    async context => {
        const remindersTime = await getRemindTime(context.guildId)
        const nextTime = getNextTime(remindersTime)
        console.debug(
            `Scheduling reminders in ${context.guildId} for ${nextTime.toLocaleTimeString()}`
        )
        return nextTime
    },
    // action
    context => {
        client.guilds
            .fetch(context.guildSnowflake)
            .then(guild => {
                console.debug(`Sending reminders in ${context.guildId}...`)

                announceReminders(guild).catch(reason => {
                    console.warn(
                        `Failed to send reminders in ${context.guildId}: ${reason}`
                    )
                })
            })
            .catch(reason => {
                console.error(
                    `Failed to send reminders in ${context.guildId}: ${reason}`
                )
            })
    }
)
