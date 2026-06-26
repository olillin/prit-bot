import fs from 'node:fs'

export const DATA_FILE = './data.json'
export const REACTIONS_FILE = './reactions.json'
export const ACTIVITIES_FILE = './activities.json'

export const discordToken =
    process.env.TOKEN ??
    (process.env.TOKEN_FILE
        ? fs.readFileSync(process.env.TOKEN_FILE, 'utf-8')
        : undefined)

export const databaseUrl =
    process.env.DATABASE_URL ??
    (process.env.DATABASE_URL_FILE
        ? fs.readFileSync(process.env.DATABASE_URL_FILE, 'utf-8')
        : undefined)

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

    // Check database URL is present
    if (!databaseUrl) {
        console.error('Missing required environment DATABASE_URL')
        valid = false
    }

    // Check if old JSON files exist
    for (const file of [DATA_FILE, REACTIONS_FILE, ACTIVITIES_FILE]) {
        if (fs.existsSync(file)) {
            console.error(
                `Found old ${file} file, please run 'pnpm migrate-from-json' and delete the file`
            )
            valid = false
        }
    }

    return valid
}
