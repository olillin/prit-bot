import type { Client, Guild, GuildMember } from 'discord.js'
import {
    getAnnouncementChannel,
    getAnnounceTime,
    getResponsibleRole,
} from '../data'
import { getNextTime, schedule } from '../util/dates'
import { getUsers } from '../util/guild'
import { getCurrentlyResponsible, getStudyWeek } from '../util/weekInfo'

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

const currentGeneration = new Map<string, number>()

async function announceLoop(
    client: Client,
    guildId: string,
    generation: number
): Promise<void> {
    // Kill loop if generation has increased
    if (generation < (currentGeneration.get(guildId) ?? 0)) return

    const isMonday = new Date().getDay() === 1

    // Announce on Mondays
    if (isMonday) {
        console.debug(`Sending announcements in ${guildId}...`)
        const guild = await client.guilds.fetch(guildId)
        await announceWeekIn(guild).catch(reason => {
            console.warn(
                `Failed to make announcement in ${guildId}: ${reason} `
            )
        })
    }

    scheduleAnnounceLoop(client, guildId, generation)
}

function scheduleAnnounceLoop(
    client: Client,
    guildId: string,
    generation: number
): Promise<void> {
    const announceTime = getAnnounceTime(guildId)
    const next = getNextTime(announceTime)
    console.debug(`Scheduling announcements in ${guildId} for ${next}`)
    return schedule(next, () => {
        announceLoop(client, guildId, generation)
    })
}

export function startAnnounceLoop(client: Client, guildId: string) {
    if (currentGeneration.has(guildId)) {
        cancelAnnounceLoop(guildId)
    } else {
        currentGeneration.set(guildId, 0)
    }

    const generation = currentGeneration.get(guildId)!
    scheduleAnnounceLoop(client, guildId, generation)
}

export function cancelAnnounceLoop(guildId: string) {
    if (!currentGeneration.has(guildId)) return
    const newGeneration = currentGeneration.get(guildId)! % 1_000_000_000
    currentGeneration.set(guildId, newGeneration)
}
