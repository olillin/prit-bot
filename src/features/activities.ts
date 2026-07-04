import db from '../db/client'
import { ActivityType, type ActivityOptions, type ClientUser } from 'discord.js'
import { activities } from '../db/schema'
import { sql } from 'drizzle-orm'

export const DEFAULT_ACTIVITY: ActivityOptions = {
    name: 'Dansbandstechno',
    type: ActivityType.Listening,
}

export async function getRandomActivity(): Promise<ActivityOptions> {
    const randomActivities = await db
        .select()
        .from(activities)
        .orderBy(sql`random()`)
        .limit(1)
    if (randomActivities.length === 0) {
        console.warn(`Empty activities table, using default activity`)
        return DEFAULT_ACTIVITY
    }

    const activity = randomActivities[0]
    let type: undefined | ActivityType = undefined
    if (activity.type) {
        type = ActivityType[activity.type]
        if (type === undefined) {
            console.warn(
                `Found invalid activity type '${activity.type}', using default type`
            )
        }
    }

    return {
        name: activity.name,
        type,
    }
}

/**
 * Cycles through activities at a set interval
 * @param clientUser Discord client user to change activity for
 * @param interval Delay between activity changes in milliseconds
 */
export async function cycleActivities(
    clientUser: ClientUser,
    interval: number
) {
    const activity = await getRandomActivity()

    console.log(
        `Set activity to (${ActivityType[activity.type!]}) ${activity.name}`
    )
    clientUser.setActivity(activity)

    setTimeout(() => {
        cycleActivities(clientUser, interval).catch(reason => {
            console.warn(`Failed to cycle activities: ${reason}`)
        })
    }, interval)
}
