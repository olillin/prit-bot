import {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    MessageFlags,
    REST,
    Routes,
} from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { discordToken } from './environment'
import { addReaction } from './features/reactions'
import type { CommandDefinition, CommandData } from './util/command'

export interface ExtendedClient extends Client {
    commands: Collection<string, CommandDefinition>
}

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
    if (!interaction.isChatInputCommand()) return

    const command = (interaction.client as ExtendedClient).commands.get(interaction.commandName)

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        )
        return
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)
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
})

function registerSlashCommands(guildId: string) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(discordToken!)
    const clientId = client.user!.id

        // and deploy your commands!
        ; (async () => {
            try {
                console.log(
                    `Started refreshing ${commands.length} application (/) commands.`
                )

                // The put method is used to fully refresh all commands in the guild with the current set
                const data = await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                ) as object[]

                console.log(
                    `Successfully reloaded ${data.length} application (/) commands.`
                )
            } catch (error) {
                // And of course, make sure you catch and log any errors!
                console.error(error)
            }
        })()
}

client.on(Events.GuildCreate, guild => {
    console.log('Joined new guild')
    registerSlashCommands(guild.id)
})

client.on(Events.MessageCreate, message => {
    addReaction(message)
})

client.on(Events.ClientReady, () => {
    client.guilds.cache.forEach(guild => {
        registerSlashCommands(guild.id)
    })

    console.log('Bot is ready')
})
