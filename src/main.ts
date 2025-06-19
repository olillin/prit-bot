import { Events } from "discord.js"
import client from "./bot"
import { discordToken, validateEnvironment } from "./environment"
import { cycleActivities } from "./features/activities"
import { scheduleAnnounceLoop } from "./features/announcements"
import { scheduleRemindersLoop } from "./features/reminders"

function main() {
    if (!validateEnvironment()) {
        console.error('Environment is invalid. Exiting...')
        process.exit(1)
    }

    client.on(Events.ClientReady, () => {
        const ONE_HOUR = 1 * 60 * 60 * 1000
        cycleActivities(client.user!, ONE_HOUR)

        scheduleAnnounceLoop(client)
        scheduleRemindersLoop(client)
    })

    console.log('Starting bot...')
    client.login(discordToken!)
}

main()
