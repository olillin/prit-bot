import type { Client, Guild, GuildMember } from 'discord.js'
import { getAnnouncementChannel, getResponsibleRole } from '../data'
import { announceTimeString } from '../environment'
import { getNextTime, schedule } from '../util/dates'
import { getUsers } from '../util/guild'
import { getCurrentlyResponsible, getStudyWeek, getWeek } from '../util/weekInfo'

/**
 * Announce info this week in a guild
 * @param guild Guild to announce week for
 * @returns If the announcement was successful
 */
export async function announceWeekIn(guild: Guild): Promise<boolean> {
    const week = await getStudyWeek()
    if (!week) {
        console.error(`Could not make announcement, week returned ${week}`)
        return false
    }

    const responsible = await getCurrentlyResponsible(guild.id)

    const announceChannel = await getAnnouncementChannel(guild)
    if (!announceChannel) {
        console.warn("Didn't make announcement in ${guild}, no channel set")
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

        assignRole(guild, users)
    } else {
        responsibleLine = `${week} gick det inte att hitta någon ansvarsvecka för :thinking:`
    }

    announceChannel.send(
        `### Det är en ny vecka!
${responsibleLine}`
    )

    return true
}

/**
 * Announce info this week in all guilds
 * @param client
 * @returns If any announcement was successful
 */
export async function announceWeekEverywhere(client: Client): Promise<boolean> {
    const guilds = await client.guilds.fetch()
    const promises = guilds.map(async guild =>
        announceWeekIn(await guild.fetch())
    )
    const success = (await Promise.all(promises)).some(x => x)
    return success
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
                        `Assigned role to ${nick} (${user.nickname ?? user.user.displayName
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


let previousWeek: string | null = null

export async function announceLoop(client: Client): Promise<void> {
    const currentWeek = await getWeek()
    if (previousWeek === null) {
        previousWeek = currentWeek
    }

    // Announce responsibility week every new week
    if (currentWeek && currentWeek !== previousWeek) {
        console.log('Sending announcements...')
        await announceWeekEverywhere(client)

        previousWeek = currentWeek
    }

    scheduleAnnounceLoop(client)
}

export function scheduleAnnounceLoop(client: Client): Promise<void> {
    const next = getNextTime(announceTimeString)
    console.log(`Scheduling announcements for ${next}`)
    return schedule(next, () => {
        announceLoop(client)
    })
}