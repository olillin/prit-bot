import { EmbedBuilder, type Guild } from 'discord.js'
import {
    getAnnouncementChannel,
    getReminderData,
    getRemindersTime,
} from '../data'
import { getNextTime } from '../util/dates'
import { getUsers, PerGuildLoop } from '../util/guild'
import { getResponsibleNicks } from '../util/weekInfo'
import client from '../bot'
import { CommandResponseError } from '../util/command'

/** Get an embed for the reminders today */
export function getRemindersEmbedToday(guild: Guild): EmbedBuilder | null {
    const reminderData = getReminderData(guild.id)
    const weekDay = new Date().getDay()

    const reminders = reminderData.days[weekDay]
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
                value: reminders.map(r => '- ' + r).join('\n'),
            },
        ])
}

export async function getRemindersUserLineToday(guild: Guild): Promise<string> {
    const reminderData = getReminderData(guild.id)

    let userLine = ''
    const responsibleNames = await getResponsibleNicks(guild.id)
    if (!responsibleNames) {
        throw new CommandResponseError('Det finns ingen ansvarig idag')
    }
    if (responsibleNames) {
        const responsibleUsers = getUsers(responsibleNames, guild)

        const mutedIds = reminderData.muted
        const userStrings = responsibleUsers.map(([nick, user]) =>
            user === undefined || mutedIds.includes(user.id)
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
        embed = getRemindersEmbedToday(guild)
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

export const remindersLoop = new PerGuildLoop(
    // getNextTime
    context => {
        const remindersTime = getRemindersTime(context.guildId)
        const nextTime = getNextTime(remindersTime)
        console.debug(
            `Scheduling reminders in ${context.guildId} for ${nextTime.toLocaleTimeString()}`
        )
        return nextTime
    },
    // action
    context => {
        client.guilds
            .fetch(context.guildId)
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
