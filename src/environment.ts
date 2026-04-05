import fs from 'fs'

export const DATA_FILE = './data.json'
export const REACTIONS_FILE = './reactions.json'
export const ACTIVITIES_FILE = './activities.json'

export const discordToken = process.env.TOKEN

/**
 * Checks whether the environment is valid and prints warnings if not
 * @returns If the environment is valid
 */
export function validateEnvironment(): boolean {
    let valid = true

    // Check token is present
    if (!discordToken) {
        console.error('Missing required environment TOKEN')
        valid = false
    }

    // Check if data file is readable and writable
    try {
        fs.accessSync(DATA_FILE, fs.constants.R_OK | fs.constants.W_OK)
    } catch {
        console.error(`Cannot read and write ${DATA_FILE}`)
        valid = false
    }

    return valid
}
