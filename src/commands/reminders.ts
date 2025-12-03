import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import {
    addReminder,
    addReminderMutedUser,
    getReminderData,
    removeReminder,
    removeReminderMutedUser,
} from '../data'
import { announceReminders } from '../features/reminders'
import { CommandMap } from '../util/command'
import { defineCommand } from '../util/guild'

export const DAYS = [
    'Måndagar',
    'Tisdagar',
    'Onsdagar',
    'Torsdagar',
    'Fredagar',
    'Lördagar',
    'Söndagar',
]

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('reminders') //
        .setDescription(
            'Hantera påminnelser och stäng av/på pings för dig själv'
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Skapa en ny påminnelse')
                .addStringOption(option =>
                    option
                        .setName('day')
                        .setDescription('Dag att hantera påminnelser för')
                        .setChoices(
                            DAYS.map(day => ({ name: day, value: day }))
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Vad påminnelsen ska säga')
                        .setMinLength(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Ta bort en påminnelse')
                .addStringOption(option =>
                    option
                        .setName('day')
                        .setDescription('Dag att hantera påminnelser för')
                        .setChoices(
                            DAYS.map(day => ({ name: day, value: day }))
                        )
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('index')
                        .setDescription(
                            'Index av påminnelsen att ta bort, kolla med `/reminders list`'
                        )
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('list').setDescription('Se alla påminnelser')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remind')
                .setDescription('Skicka påminnelser igen')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Sluta bli pingad av påminnelser')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unmute')
                .setDescription('Bli pingad av påminnelser')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as
            | 'add'
            | 'remove'
            | 'list'
            | 'send'
            | 'mute'
            | 'unmute'

        const commandMap: CommandMap = {
            add,
            remove,
            list,
            send,
            mute,
            unmute,
        }

        commandMap[command](interaction)
    },
})

async function add(interaction: ChatInputCommandInteraction) {
    const dayString = interaction.options.getString('day', true)
    const day = DAYS.indexOf(dayString) + 1

    const message = interaction.options.getString('message')
    if (!message) {
        await interaction.reply({
            content: 'Du måste ange ett meddelande för påminnelsen',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    addReminder(guildId, day, message)

    await interaction.reply({
        content: `Skapade ny påminnelse på ${dayString} som säger: "${message}"`,
        flags: MessageFlags.Ephemeral,
    })
}

async function remove(interaction: ChatInputCommandInteraction) {
    const dayString = interaction.options.getString('day', true)
    const day = DAYS.indexOf(dayString) + 1

    // Get index
    const index = interaction.options.getInteger('index', true) - 1

    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        removeReminder(guildId, day, index)
    } catch (message) {
        if (typeof message === 'string') {
            await interaction.reply({
                content: message as string,
                flags: MessageFlags.Ephemeral,
            })
        } else {
            await interaction.reply({
                content: 'Något gick fel, försök igen senare',
                flags: MessageFlags.Ephemeral,
            })
        }
        return
    }

    // Success message
    await interaction.reply({
        content: `Tog bort påminnelse ${index + 1} på ${dayString}`,
        flags: MessageFlags.Ephemeral,
    })
}

async function list(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }
    const reminders = getReminderData(guildId).days

    const embed = new EmbedBuilder()
        .setTitle('Påminnelser för Ansvarsveckor')
        .setColor('#ffbb00')

    if (Object.keys(reminders).length === 0) {
        embed.setDescription('Det finns inga påminnelser')
    } else {
        embed.addFields(
            Object.entries(reminders).map(([day, reminders]) => {
                const prettyDay = DAYS[parseInt(day) - 1]
                return {
                    name: prettyDay,
                    value: reminders
                        .map((message, i) => `${i + 1}. ${message}`)
                        .join('\n'),
                }
            })
        )
    }

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
    })
}

async function send(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild
    if (!guild) {
        throw new Error('Guild is not defined')
    }
    await interaction.deferReply({
        flags: MessageFlags.Ephemeral,
    })
    try {
        await announceReminders(interaction.guild)
    } catch (message) {
        console.error('Failed to announce reminders: ' + message)
        if (typeof message !== 'string') {
            await interaction.editReply('Något gick fel, försök igen senare')
        } else {
            await interaction.editReply(message)
        }
        return
    }
    await interaction.editReply('Påminnelser skickade!')
}

async function mute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        addReminderMutedUser(guildId, interaction.user.id)
    } catch (message) {
        if (typeof message !== 'string') {
            console.warn('Failed to unmute reminders: ' + message)
            await interaction.reply({
                content: 'Something went wrong, please try again later',
                flags: MessageFlags.Ephemeral,
            })
            return
        }
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    await interaction.reply({
        content: 'Du kommer inte bli pingad av framtida påminnelser',
        flags: MessageFlags.Ephemeral,
    })
}

async function unmute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        removeReminderMutedUser(guildId, interaction.user.id)
    } catch (message) {
        if (typeof message !== 'string') {
            console.warn('Failed to unmute reminders: ' + message)
            await interaction.reply({
                content: 'Something went wrong, please try again later',
                flags: MessageFlags.Ephemeral,
            })
            return
        }
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    await interaction.reply({
        content: 'Du kommer bli pingad av framtida påminnelser',
        flags: MessageFlags.Ephemeral,
    })
}
