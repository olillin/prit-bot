const { getAnnouncementChannel, getResponsibleRole } = require('./data')
const { getWeek, getStudyWeek, getCurrentlyResponsible } = require('./weekInfo')
const { announceReminders } = require('./reminders')
const { getNextTime, sleep, getUsers } = require('./util')

const announceTimeString = process.env.ANNOUNCE_TIME ?? '09'
try {
    getNextTime(announceTimeString)
} catch (e) {
    console.error('Invalid ANNOUNCE_TIME:', e.message)
    process.exit()
}

async function waitUntilNextAnnouncement() {
    const nextAnnouncement = getNextTime(announceTimeString)
    const timeUntilAnnouncement = nextAnnouncement.getTime() - Date.now()
    await sleep(timeUntilAnnouncement)
}

/**
 * Announce info this week in a guild
 * @param {import('discord.js').Guild} guild Guild to announce week for
 * @returns {Promise<boolean>} If the announcement was successful
 */
async function announceWeekIn(guild) {
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

        /** @type {string} */
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
 * @param {import('discord.js').Client} client
 * @returns {Promise<boolean>} If any announcement was successful
 */
async function announceWeekEverywhere(client) {
    const guilds = await client.guilds.fetch()
    const promises = guilds.map(async guild =>
        announceWeekIn(await guild.fetch())
    )
    const success = (await Promise.all(promises)).some(x => x)
    return success
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {Array<[string, import('discord.js').GuildMember | undefined]>} users
 */
async function assignRole(guild, users) {
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

async function announceRemindersEverywhere(client) {
    const guilds = await client.guilds.fetch()
    const promises = guilds.map(async guild =>
        announceReminders(await guild.fetch()).catch()
    )
    const success = (await Promise.all(promises)).some(x => x)
    return success
}

/** @type {string} */
let previousWeek

/**
 * @param {import('discord.js').Client} client
 * @returns {Promise<never>}
 */
async function announceLoop(client) {
    // @ts-ignore
    previousWeek = await getWeek()
    while (true) {
        // Wait for next announcement
        await waitUntilNextAnnouncement()

        // Announce responsibility week every week
        const nowWeek = await getWeek()
        if (nowWeek && nowWeek !== previousWeek) {
            await announceWeekEverywhere(client)

            previousWeek = nowWeek
        }

        // Announce reminders every day
        await announceRemindersEverywhere(client)
    }
}

module.exports = {
    announceWeekIn,
    announceWeekEverywhere,
    announceLoop,
}
