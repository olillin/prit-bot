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

            if (parsed.length === 0) {
                console.warn(
                    `Empty activities in ${filename}, using default activities`
                )
                return DEFAULT_ACTIVITIES
            }

            parsed.forEach(activity => {
                if (activity.type) {
                    activity.type = ActivityType[activity.type]
                    if (activity.type === undefined)
                        throw new Error('Invalid activity type')
                }
            })

            return parsed
        } catch {
            console.warn(
                `Invalid activities in ${filename}, using default activities`
            )
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
    /** @type {import('discord.js').ActivityOptions | undefined} */
    let previousActivity = undefined
    while (true) {
        // Get new activity
        const activities = getActivities()
        let activity = previousActivity
        while (
            activity === undefined ||
            (activities.length > 1 &&
                JSON.stringify(activity) === JSON.stringify(previousActivity))
        ) {
            activity = activities[Math.floor(Math.random() * activities.length)]
        }

        // @ts-ignore
        console.log(
            `Set activity to (${ActivityType[activity.type]}) ${activity.name}`
        )
        await clientUser.setActivity(activity)

        await sleep(interval)

        previousActivity = activity
    }
}

module.exports = { DEFAULT_ACTIVITIES, getActivities, cycleActivities }
