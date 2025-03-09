const fs = require('node:fs')
const path = require('node:path')
const { Client, GatewayIntentBits, Collection, Events, Routes, REST, MessageFlags } = require('discord.js')
const { waitForWeekStart } = require('./announce')
const { cycleActivities } = require('./activities')

const { TOKEN } = process.env
if (!TOKEN) {
    console.error('Missing required environment TOKEN')
    process.exit()
}

/** @type {import('discord.js').Client} */
const client = /** @type {any} */ (
    new Client({
        intents: [
            GatewayIntentBits.Guilds, //
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
        ],
    })
)

// @ts-ignore
client.commands = new Collection()
const commands = []

const commandFolder = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandFolder, file)
    const command = require(filePath)
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        // @ts-ignore
        client.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
}

// Command executor
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    // @ts-ignore
    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
        }
    }
})

function registerSlashCommands(guildId) {
    // Construct and prepare an instance of the REST module
    // @ts-ignore
    const rest = new REST().setToken(TOKEN)
    // @ts-ignore
    const clientId = client.user.id

    // and deploy your commands!
    ;(async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`)

            // The put method is used to fully refresh all commands in the guild with the current set
            const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })

            // @ts-ignore
            console.log(`Successfully reloaded ${data.length} application (/) commands.`)
        } catch (error) {
            // And of course, make sure you catch and log any errors!
            console.error(error)
        }
    })()
}

client.on('guildCreate', guild => {
    console.log('Joined new guild')
    registerSlashCommands(guild.id)
})

client.on('ready', () => {
    client.guilds.cache.forEach(guild => {
        registerSlashCommands(guild.id)
    })

    const ONE_HOUR = 1 * 60 * 60 * 1000
    // @ts-ignore
    cycleActivities(client.user, ONE_HOUR)

    waitForWeekStart(client)

    console.log('Bot is ready')
})

client.login(TOKEN)
