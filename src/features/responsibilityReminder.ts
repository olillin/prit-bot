import { ONE_DAY_MS } from 'iamcal'
import { getResponsibleNicks } from '../util/weekInfo'
import { getResponsibleResponsibleRole } from '../data'
import client from '../bot'

/**
 * Send a reminder to set the responsibility week next week.
 * @param guildId The guild to check
 * @returns Whether or not the reminder was sent.
 */
export async function sendResponsibilityWeekReminder(
    guildId: string
): Promise<boolean> {
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
    const guild = await client.guilds.fetch(guildId)
    const responsibleResponsibleRole = await getResponsibleResponsibleRole(
        guild
    )
    if (!responsibleResponsibleRole) {
        console.warn(
            'Unable to send reminders to set responsibility week, no responsible responsible role'
        )
        return false
    }

    // Update cache
    await guild.members.fetch()
    if (responsibleResponsibleRole.members.size === 0) {
        console.warn(
            'Unable to send reminders to set responsibility week, nobody has the role'
        )
        return false
    }

    responsibleResponsibleRole.members.forEach(member => {
        console.debug(
            `Sending reminder to assign responsibility week to ${member.id} (${member.displayName})`
        )
        member.send(
            'Hej! Jag märkte att det inte finns någon som har ansvarsvecka imorgon så tänkte påminna dig :blush:'
        )
    })

    return true
}
