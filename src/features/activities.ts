import type { ActivityOptions, ClientUser } from 'discord.js'

import { ActivityType } from 'discord.js'
import fs from 'fs'
import { ACTIVITIES_FILE } from '../environment'

export const DEFAULT_ACTIVITIES: ActivityOptions[] = [
    {
        name: 'Dansbandstechno',
        type: ActivityType.Listening,
    },
]

export function getActivities(): ActivityOptions[] {
    if (fs.existsSync(ACTIVITIES_FILE)) {
        const text = fs.readFileSync(ACTIVITIES_FILE, 'utf8')

        try {
            const parsed = JSON.parse(text) as ActivityOptions[]

            if (parsed.length === 0) {
                console.warn(
                    `Empty activities in ${ACTIVITIES_FILE}, using default activities`
                )
                return DEFAULT_ACTIVITIES
            }

            parsed.forEach(activity => {
                if (activity.type) {
                    activity.type = ActivityType[
                        activity.type
                    ] as unknown as ActivityType
                    if (activity.type === undefined)
                        throw new Error('Invalid activity type')
                }
            })

            return parsed
        } catch {
            console.warn(
                `Invalid activities in ${ACTIVITIES_FILE}, using default activities`
            )
        }
    }
    return DEFAULT_ACTIVITIES
}

/**
 * Cycles through activities at a set interval
 * @param clientUser Discord client user to change activity for
 * @param interval Delay between activity changes in milliseconds
 */
export function cycleActivities(
    clientUser: ClientUser,
    interval: number,
    previousActivity: ActivityOptions | undefined = undefined
) {
    // Get new activity
    const activities = getActivities()
    let activity = previousActivity
    while (
        activity == undefined ||
        (activities.length > 1 &&
            JSON.stringify(activity) === JSON.stringify(previousActivity))
    ) {
        activity = activities[Math.floor(Math.random() * activities.length)]
    }

    console.log(
        `Set activity to (${ActivityType[activity.type!]}) ${activity.name}`
    )
    clientUser.setActivity(activity)

    setTimeout(() => {
        cycleActivities(clientUser, interval, activity)
    }, interval)
}
