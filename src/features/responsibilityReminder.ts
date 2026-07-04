import { ONE_DAY_MS } from 'iamcal'
import { getResponsibleNicks } from '../util/weekInfo'
import { getGuildId, getResponsibleResponsibleRole } from '../data'
import client from '../bot'

/**
 * Send a reminder to set the responsibility week next week.
 * @param guildSnowflake The guild to check
 * @returns Whether or not the reminder was sent.
 */
export async function sendResponsibilityWeekReminder(
    guildSnowflake: string
): Promise<boolean> {
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error('Failed to get guild id')
    }

    // Check if there is anybody responsible
    const nextWeek = Date.now() + ONE_DAY_MS * 7
    let responsibleNextWeek: string[] | undefined = undefined
    try {
        responsibleNextWeek = await getResponsibleNicks(guildId, nextWeek)
    } catch {
        console.warn(
            'Did not send reminder to set responsibility week. Failed to get responsibility weeks'
        )
        return false
    }

    const responsibleExists =
        responsibleNextWeek !== undefined && responsibleNextWeek.length !== 0
    if (responsibleExists) return false

    // Get who to send to
    const guild = await client.guilds.fetch(guildSnowflake)
    const responsibleResponsibleRole =
        await getResponsibleResponsibleRole(guild)
    if (!responsibleResponsibleRole) {
        console.warn(
            'Unable to send reminders to set responsibility week, no responsible responsible role'
        )
        return false
    }

    if (responsibleResponsibleRole.members.size === 0) {
        console.warn(
            'Unable to send reminders to set responsibility week, nobody has the role'
        )
        return false
    }

    await Promise.all(
        responsibleResponsibleRole.members.map(async member => {
            console.debug(
                `Sending reminder to assign responsibility week to ${member.id} (${member.displayName})`
            )
            await member.send(
                'Hej! Jag märkte att det inte finns någon som har ansvarsvecka imorgon så tänkte påminna dig :blush:'
            )
        })
    )

    return true
}
