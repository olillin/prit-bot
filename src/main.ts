import client from './bot'
import { discordToken, validateEnvironment } from './environment'

function main() {
    if (!validateEnvironment()) {
        console.error('Environment is invalid. Exiting...')
        process.exit(1)
    }

    console.log('Starting bot...')
    client.login(discordToken).catch(reason => {
        console.error('Bot failed to login:', reason)
    })
}

main()
