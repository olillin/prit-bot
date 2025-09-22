export const DATA_FILE = '../data.json'
export const REACTIONS_FILE = '../reactions.json'
export const ACTIVITIES_FILE = '../activities.json'

export const discordToken = process.env.TOKEN

/**
 * Checks whether the environment is valid and prints warnings
 * @returns If the environment is valid
 */
export function validateEnvironment(): boolean {
    let valid = true

    if (!discordToken) {
        console.warn('Missing required environment TOKEN')
        valid = false
    }

    return valid
}
