import {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    REST,
    Routes
} from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { discordToken } from './environment.js'
import { addReaction } from './features/reactions.js'
import { executeButtonInteraction } from './listeners/buttons.js'
import { executeChatInputCommandInteraction } from './listeners/commands.js'
import type { CommandData, CommandDefinition, ExtendedClient } from './types.js'

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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const commandFolder = path.join(dirname, 'commands')
const commandFiles = fs
    .readdirSync(commandFolder)
    .filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandFolder, file)
    const command = (await import(`file:///${filePath}`)).default as CommandDefinition
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
        executeChatInputCommandInteraction(interaction)
    } else if (interaction.isButton()) {
        executeButtonInteraction(interaction)
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
