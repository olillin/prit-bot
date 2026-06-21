import { drizzle } from 'drizzle-orm/node-postgres'
import client from './bot'
import { discordToken, validateEnvironment } from './environment'

function main() {
    if (!validateEnvironment()) {
        console.error('Environment is invalid. Exiting...')
        process.exit(1)
    }

    console.log('Connecting Drizzle...')
    const db = drizzle(process.env.DATABASE_URL!)

    console.log('Starting bot...')
    client.login(discordToken).catch(reason => {
        console.error('Bot failed to login:', reason)
    })
}

main()
