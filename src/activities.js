const { ActivityType } = require('discord.js')
const fs = require('fs')
const { sleep } = require('./util')

/** @type {import("discord.js").ActivityOptions[]} */
const DEFAULT_ACTIVITIES = [
    {
        name: 'Dansbandstechno',
        type: ActivityType.Listening,
    },
]

/** @returns {import("discord.js").ActivityOptions[]} */
function getActivities(filename = 'activities.json') {
    if (fs.existsSync(filename)) {
        const text = fs.readFileSync(filename, 'utf8')

        try {
            const parsed = JSON.parse(text)

            parsed.forEach(activity => {
                if (activity.type) {
                    activity.type = ActivityType[activity.type]
                    if (activity.type === undefined) throw new Error('Invalid activity type')
                }
            })

            return parsed
        } catch {
            console.warn(`Invalid activities in ${filename}, using default activities`)
        }
    }
    return DEFAULT_ACTIVITIES
}

/**
 * Cycles through activities at a set interval
 * @param {import('discord.js').ClientUser} clientUser Discord client user to change activity for
 * @param {number} interval Delay between activity changes in milliseconds
 * @returns {Promise<never>}
 */
async function cycleActivities(clientUser, interval) {
    const activities = getActivities()

    let currentActivity = Math.floor(Math.random() * activities.length)
    while (true) {
        const activity = activities[currentActivity]
        // @ts-ignore
        console.log(`Set activity to (${ActivityType[activity.type]}) ${activity.name}`)
        await clientUser.setActivity(activity)

        await sleep(interval)

        // Skip if there's only one activity
        if (activities.length === 1) continue

        // Get new activity randomly
        let newActivity = currentActivity
        while (newActivity === currentActivity) {
            newActivity = Math.floor(Math.random() * activities.length)
        }
        currentActivity = newActivity
    }
}

module.exports = { DEFAULT_ACTIVITIES, getActivities, cycleActivities }
