import { splitTimeString } from "./util"

export const announceTimeString = process.env.ANNOUNCE_TIME ?? '09:00'
export const remindersTimeString = process.env.REMINDERS_TIME ?? '12:00'
export const discordToken = process.env.TOKEN

/**
 * Checks whether the environment is valid and prints warnings
 * @returns If the environment is valid
 */
export function validateEnvironment(): boolean {
    let valid = true

    try {
        splitTimeString(announceTimeString)
    } catch (e) {
        console.warn('Invalid ANNOUNCE_TIME:', (e as Error).message)
        valid = false
    }
    try {
        splitTimeString(remindersTimeString)
    } catch (e) {
        console.warn('Invalid REMINDERS_TIME:', (e as Error).message)
        valid = false
    }
    if (!discordToken) {
        console.warn('Missing required environment TOKEN')
        valid = false
    }

    return valid
}