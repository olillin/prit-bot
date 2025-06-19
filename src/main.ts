import { Events } from "discord.js"
import client from "./bot"
import { cycleActivities } from "./features/activities"
import { scheduleAnnounceLoop } from "./features/announcements"
import { scheduleRemindersLoop } from "./features/reminders"
import { discordToken } from "./environment"

function main() {
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
