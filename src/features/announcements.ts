import type { Client, Guild, GuildMember } from 'discord.js'
import {
    getAnnouncementChannel,
    getAnnounceTime,
    getResponsibleRole,
} from '../data'
import { getNextTime, schedule } from '../util/dates'
import { getUsers, PerGuildLoop } from '../util/guild'
import { getResponsibleNicks, getStudyWeek } from '../util/weekInfo'
import client from '../bot'
import { sendResponsibilityWeekReminder } from './responsibilityReminder'

/**
 * Announce info this week in a guild
 * @param guild Guild to announce week for
 * @returns If the announcement was successful
 * @throws If unable to make announcement­
 */
export async function announceWeekIn(guild: Guild): Promise<boolean> {
    const week = await getStudyWeek()
    if (!week) {
        console.error(`Could not make announcement, week returned ${week}`)
        return false
    }

    const responsible = await getResponsibleNicks(guild.id)

    const announceChannel = await getAnnouncementChannel(guild)
    if (!announceChannel) {
        console.warn(`Didn't make announcement in ${guild}, no channel set`)
        return false
    }

    let responsibleLine = ''
    if (responsible) {
        const users = await getUsers(responsible, guild)
        const stringUsers = users.map(
            ([name, user]) => user?.toString() ?? `@${name}`
        )

        let userList = ''
        if (stringUsers.length <= 1) {
            userList = stringUsers.join()
        } else {
            const last = stringUsers.pop()
            userList = stringUsers.join(', ') + ' och ' + last
        }

        responsibleLine = `${week} har ${userList} ansvarsvecka, gör ert bästa men slit inte ut er! <:pixelnheart:1318195394781384714>`
    } else {
        responsibleLine = `${week} gick det inte att hitta någon ansvarsvecka för :thinking:`
    }

    announceChannel.send(
        `### Det är en ny vecka!
${responsibleLine}`
    )

    return true
}

async function assignRole(
    guild: Guild,
    users: Array<[string, GuildMember | undefined]>
) {
    const role = await getResponsibleRole(guild)
    if (!role) {
        console.warn('Failed to assign roles, could not get role')
        return
    }

    try {
        const members = await guild.members.fetch()

        console.log(`Removing role '${role.name}' from ${members.size} members`)
        await Promise.all(
            members.map(member => {
                if (member?.roles?.cache.some(r => r.id === role.id)) {
                    member.roles.remove(role)
                }
            })
        )

        console.log('Adding role to selected members')
        await Promise.all(
            users.map(async ([nick, user]) => {
                if (user) {
                    await user.roles.add(role)
                    console.info(
                        `Assigned role to ${nick} (${
                            user.nickname ?? user.user.displayName
                        })`
                    )
                } else
                    console.warn(
                        `Failed to assign role to ${nick}, unable to find user`
                    )
            })
        )
    } catch (e) {
        console.error('Failed to assign roles')
        console.error(e)
        console.trace()
    }
}

export const announceLoop = new PerGuildLoop(
    // getNextTime
    context => {
        const announceTime = getAnnounceTime(context.guildId)
        const nextTime = getNextTime(announceTime)
        console.debug(
            `Scheduling announcements in ${context.guildId} for ${nextTime}`
        )
        return nextTime
    },
    // getNextTime
    async context => {
        const day = new Date().getDay()
        const isMonday = day === 1
        const isSunday = day === 0

        if (isMonday) {
            // New week
            console.debug(`Sending announcements in ${context.guildId}...`)
            const guild = await client.guilds.fetch(context.guildId)
            await announceWeekIn(guild).catch(reason => {
                console.warn(
                    `Failed to make announcement in ${context.guildId}: ${reason} `
                )
            })
        } else if (isSunday) {
            // Reminder if there is no
            sendResponsibilityWeekReminder(context.guildId)
        }

        updateResponsibilityRole(context.guildId)
    }
)
async function updateResponsibilityRole(guildId: string) {
    const [guild, responsibleNicks] = await Promise.all([
        client.guilds.fetch(guildId),
        getResponsibleNicks(guildId),
    ])
    if (responsibleNicks) {
        const users = await getUsers(responsibleNicks, guild)
        await assignRole(guild, users)
    }
}
