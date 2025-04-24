const { EmbedBuilder } = require('discord.js')
const { getReminderData, getAnnouncementChannel } = require('./data')
const {
    getDayOfResponsibilityWeek,
    getCurrentlyResponsible,
} = require('./weekInfo')
const { getUsers } = require('./util')

/**
 * Get an embed for the reminders today
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').EmbedBuilder|null>}
 */
async function getRemindersEmbedToday(guild) {
    const reminderData = getReminderData(guild.id)
    let day
    try {
        day = await getDayOfResponsibilityWeek(guild.id)
    } catch (e) {
        console.warn('Failed to get day of responsibility week')
        return null
    }

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
    /** @type {string} */
    let userLine = ''
    const responsibleNames = await getCurrentlyResponsible(guild.id)
    if (responsibleNames) {
        const responsibleUsers = await getUsers(responsibleNames, guild).then(
            users => users.filter(user => user[1] !== undefined)
        )

        const mutedIds = reminderData.muted
        const userStrings = responsibleUsers.map(([nick, user]) =>
            user === undefined || mutedIds.includes(user.id)
                ? nick
                : `<@${user.id}>`
        )
        userLine = userStrings.join(' ') + '\n'
    }
    const description =
        userLine + '-# Använd `/reminders` kommandot om du inte vill bli pingad'

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

/**
 *
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<void>}
 */
async function announceReminders(guild) {
    const embed = await getRemindersEmbedToday(guild)
    if (!embed) {
        throw 'Skickade inte påminnelser, inga påminnelser idag'
    }

    const channel = await getAnnouncementChannel(guild)
    if (!channel) {
        throw 'Skickade inte påminnelser, ingen kanal angiven'
    }

    try {
        await channel.send({ embeds: [embed] })
    } catch (e) {
        console.error('Failed to send reminders', e)
        throw 'Misslyckades med att skicka meddelande'
    }
}

module.exports = { getRemindersEmbedToday, announceReminders }
