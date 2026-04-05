import {
    Client,
    Events,
    GatewayIntentBits,
    MessageFlags,
    REST,
    Routes,
} from 'discord.js'
import { ONE_HOUR_MS } from 'iamcal'
import { discordToken } from './environment'
import { cycleActivities } from './features/activities'
import { announceLoop } from './features/announcements'
import { addReaction } from './features/reactions'
import { remindersLoop } from './features/reminders'
import type { ExtendedClient } from './types'
import commands from './commands'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, //
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
}) as ExtendedClient
client.commands = commands

export default client

// Command executor
client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = (interaction.client as ExtendedClient).commands.get(
        interaction.commandName
    )

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        )
        return
    }

    command.execute(interaction).catch(async error => {
        console.error(
            `Error while to executing command '${interaction.commandName}':`,
            error
        )
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            })
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral,
            })
        }
    })
})

async function registerSlashCommands(guildId: string) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(discordToken!)
    const clientId = client.user!.id

    // Deploy the application commands to the guild
    try {
        console.log(
            `Started refreshing ${client.commands.size} application (/) commands.`
        )
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = (await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands.map(command => command.data.toJSON()) }
        )) as object[]

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        )
    } catch (error) {
        console.error(error)
    }
}

client.on(Events.ClientReady, () => {
    cycleActivities(client.user!, ONE_HOUR_MS)

    client.guilds.cache.forEach(guild => {
        announceLoop.start(guild.id)
        remindersLoop.start(guild.id)

        // Get initial guild members in each server. Await to avoid spam
        guild.members.fetch().catch(reason => {
            console.warn(
                `Failed to fetch members in ${guild.id}, cache may be outdated: ${reason}`
            )
        })
    })
})

client.on(Events.GuildCreate, guild => {
    console.log('Joined new guild')
    registerSlashCommands(guild.id).catch(reason => {
        console.error('Failed to register slash commands:', reason)
    })
    announceLoop.start(guild.id)
    remindersLoop.start(guild.id)
})

client.on(Events.MessageCreate, message => {
    addReaction(message)

    // Make fun of people trying to use @channel
    if (message.content.includes('@channel')) {
        message.channel
            .send({
                content:
                    '@everyone titta här, de tror de är på Slack eller nåt',
            })
            .catch(error => {
                console.warn('Failed to react to @channel:', error)
            })
    }
})

client.on(Events.ClientReady, () => {
    Promise.all(
        client.guilds.cache.map(guild => registerSlashCommands(guild.id))
    )
        .then(() => {
            console.log('Bot is ready')
        })
        .catch(reason => {
            console.error('Bot failed to get ready:', reason)
        })
})
