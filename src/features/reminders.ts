import { Client, EmbedBuilder, type Guild } from 'discord.js'
import { getAnnouncementChannel, getReminderData } from '../data'
import { remindersTimeString } from '../environment'
import { getNextTime, schedule } from '../util/dates'
import { getUsers } from '../util/guild'
import { getCurrentlyResponsible, getDayOfResponsibilityWeek } from '../util/weekInfo'

/** Get an embed for the reminders today */
export async function getRemindersEmbedToday(
    guild: Guild
): Promise<EmbedBuilder | null> {
    const reminderData = getReminderData(guild.id)
    const day = getDayOfResponsibilityWeek(guild.id)

    const reminders = reminderData.days[day]
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
    const description = '-# Använd `/reminders` kommandot om du inte vill bli pingad'

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
    const responsibleNames = await getCurrentlyResponsible(guild.id)
    if (!responsibleNames) {
        throw 'Det finns ingen ansvarig idag'
    }
    if (responsibleNames) {
        const responsibleUsers = await getUsers(responsibleNames, guild)

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
        embed = await getRemindersEmbedToday(guild)
    } catch (message) {
        if (typeof message === 'string') {
            throw `Kunde inte skicka påminnelser: ${message} `
        } else {
            throw 'Kunde inte skicka påminnelser, ett okänt fel inträffade'
        }
    }
    if (!embed) {
        throw 'Skickade inte påminnelser, inga påminnelser idag'
    }

    let userLine: string
    try {
        userLine = await getRemindersUserLineToday(guild)
    } catch (message) {
        if (typeof message === 'string') {
            throw `Skickade inte skicka påminnelser: ${message} `
        } else {
            throw 'Kunde inte skicka påminnelser, ett okänt fel inträffade'
        }
    }

    const channel = await getAnnouncementChannel(guild)
    if (!channel) {
        throw 'Skickade inte påminnelser, ingen kanal angiven'
    }

    try {
        await channel.send({ content: userLine, embeds: [embed] })
    } catch (e) {
        console.error('Failed to send reminders', e)
        throw 'Misslyckades med att skicka meddelande'
    }
}

async function announceRemindersEverywhere(client: Client): Promise<boolean> {
    const guilds = await client.guilds.fetch()
    const promises = guilds.map(async guild =>
        announceReminders(await guild.fetch()).catch()
    )
    let success = true
    await Promise.all(promises).catch(reason => {
        console.warn(`Failed to announce reminders: ${reason} `)
        success = false
    })
    return success
}

export async function remindersLoop(client: Client): Promise<void> {
    // Send reminders every day
    console.log('Sending reminders...')
    await announceRemindersEverywhere(client)

    scheduleRemindersLoop(client)
}

export function scheduleRemindersLoop(client: Client): Promise<void> {
    const next = getNextTime(remindersTimeString)
    console.log(`Scheduling reminders for ${next}`)
    return schedule(next, () => {
        remindersLoop(client)
    })
}