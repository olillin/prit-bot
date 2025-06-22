import { splitTimeString } from './util/dates.js'

export const DATA_FILE = '../data.json'
export const REACTIONS_FILE = '../reactions.json'
export const ACTIVITIES_FILE = '../activities.json'

export const announceTimeString = process.env.ANNOUNCE_TIME ?? '09:00'
export const remindersTimeString = process.env.REMINDERS_TIME ?? '12:00'
export const discordToken = process.env.TOKEN
export const gammaUsername = process.env.GAMMA_USERNAME
export const gammaPassword = process.env.GAMMA_PASSWORD

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

    if (!gammaUsername) {
        console.warn('Missing environment GAMMA_USERNAME, will be unable to fetch BookIT data')
    }
    if (!gammaPassword) {
        console.warn('Missing environment GAMMA_PASSWORD, will be unable to fetch BookIT data')
    }

    return valid
}