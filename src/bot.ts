import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    MessageFlags,
    REST,
    Routes,
} from 'discord.js'
import { ONE_HOUR_MS } from 'iamcal'
import fs from 'node:fs'
import path from 'node:path'
import { discordToken } from './environment'
import { cycleActivities } from './features/activities'
import { announceLoop } from './features/announcements'
import { addReaction } from './features/reactions'
import { remindersLoop } from './features/reminders'
import type { ExtendedClient } from './types'
import type { CommandData, CommandDefinition } from './util/command'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, //
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
}) as ExtendedClient
export default client

client.commands = new Collection<string, CommandDefinition>()
const commands: CommandData[] = []

const commandFolder = path.join(__dirname, 'commands')
const commandFiles = fs
    .readdirSync(commandFolder)
    .filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandFolder, file)
    const command = require(filePath).default as CommandDefinition
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
    } else {
        console.warn(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property:`
        )
        console.warn(command)
    }
}

// Command executor
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction)
    }
})

async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const command = (interaction.client as ExtendedClient).commands.get(
        interaction.commandName
    )

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        )
        return
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(
            `Error while to executing command '${interaction.commandName}': ${error}`
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
    }
}

function registerSlashCommands(guildId: string) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(discordToken!)
    const clientId = client.user!.id

    // and deploy your commands!
    ;(async () => {
        try {
            console.log(
                `Started refreshing ${commands.length} application (/) commands.`
            )

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = (await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands }
            )) as object[]

            console.log(
                `Successfully reloaded ${data.length} application (/) commands.`
            )
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error)
        }
    })()
}

client.on(Events.ClientReady, () => {
    cycleActivities(client.user!, ONE_HOUR_MS)

    client.guilds.cache.forEach(async guild => {
        announceLoop.start(guild.id)
        remindersLoop.start(guild.id)

        // Get initial guild members in each server. Await to avoid spam
        await guild.members.fetch().catch(reason => {
            console.warn(
                `Failed to fetch members in ${guild.id}, cache may be outdated: ${reason}`
            )
        })
    })
})

client.on(Events.GuildCreate, guild => {
    console.log('Joined new guild')
    registerSlashCommands(guild.id)
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
    client.guilds.cache.forEach(guild => {
        registerSlashCommands(guild.id)
    })

    console.log('Bot is ready')
})
