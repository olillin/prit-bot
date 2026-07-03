import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import {
    addReminder,
    addNoPingUser,
    getReminders,
    removeReminder,
    removeNoPingUser,
    DAYS,
    getGuildId,
} from '../data'
import {
    announceReminders,
    collapseReminderIds,
    getOriginalReminder,
} from '../features/reminders'
import { CommandMap, editReplyWithError, replyWithError } from '../util/command'
import { defineCommand } from '../util/guild'
import { Reminder } from '../types'

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
                .addIntegerOption(option =>
                    option
                        .setName('id')
                        .setDescription(
                            'Id av påminnelsen att ta bort, kolla med `/reminders list`'
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

        await commandMap[command](interaction)
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
    const guildSnowflake = interaction.guildId
    if (!guildSnowflake) {
        throw new Error('Guild snowflake is not defined')
    }

    const guildId = await getGuildId(guildSnowflake)
    if (!guildId) {
        throw new Error('Guild is missing from database')
    }

    addReminder(guildId, day, message)

    await interaction.reply({
        content: `Skapade ny påminnelse på ${dayString} som säger: "${message}"`,
        flags: MessageFlags.Ephemeral,
    })
}

async function remove(interaction: ChatInputCommandInteraction) {
    const guildSnowflake = interaction.guildId
    if (guildSnowflake === null) {
        throw new Error('Guild id is not defined')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error('Guild could not be found')
    }

    // Get id
    const localId = interaction.options.getInteger('id', true)
    const reminders = await getReminders(guildId)
    const reminder = getOriginalReminder(localId, reminders)

    if (reminder === null) {
        await interaction.reply({
            content: `Kunde inte hitta påminnelse #${localId}`,
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    try {
        removeReminder(reminder.id, guildId)
    } catch (message) {
        if (typeof message === 'string') {
            await interaction.reply({
                content: message,
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
        content: `Tog bort påminnelse #${localId} "${reminder.message}"`,
        flags: MessageFlags.Ephemeral,
    })
}

async function list(interaction: ChatInputCommandInteraction) {
    const guildSnowflake = interaction.guildId
    if (guildSnowflake === null) {
        throw new Error('Guild id is not defined')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error('Guild could not be found')
    }
    const reminders = await getReminders(guildId)

    if (Object.keys(reminders).length === 0) {
        interaction.reply({
            content: `Det finns inga påminnelser än. Skapa en med </reminders add:${interaction.commandId}>`,
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const localReminders = Object.entries(
        collapseReminderIds(reminders)
    ) as unknown as [number, Reminder[]][]

    const embed = new EmbedBuilder()
        .setTitle('Påminnelser för Ansvarsveckor')
        .setColor('#ffbb00')

    embed.addFields(
        localReminders.map(([day, reminders]) => {
            const prettyDay = DAYS[day - 1]
            return {
                name: prettyDay,
                value:
                    reminders.length === 0
                        ? '-# *Inga påminnelser*'
                        : reminders
                              .map(({ id, message }) => `#${id}. ${message}`)
                              .join('\n'),
            }
        })
    )

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
    } catch (error) {
        console.error('Failed to announce reminders:', error)
        await editReplyWithError(interaction, error)
        return
    }
    await interaction.editReply('Påminnelser skickade!')
}

async function mute(interaction: ChatInputCommandInteraction) {
    const guildSnowflake = interaction.guildId
    if (!guildSnowflake) {
        throw new Error('Guild id is not defined')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (!guildId) {
        throw new Error('Guild is missing from database')
    }

    try {
        addNoPingUser(guildId, interaction.user.id)
    } catch (error) {
        console.warn('Failed to unmute reminders:', error)
        await replyWithError(interaction, error, true)
        return
    }
    await interaction.reply({
        content: 'Du kommer inte bli pingad av framtida påminnelser',
        flags: MessageFlags.Ephemeral,
    })
}

async function unmute(interaction: ChatInputCommandInteraction) {
    const guildSnowflake = interaction.guildId
    if (!guildSnowflake) {
        throw new Error('Guild id is not defined')
    }
    const guildId = await getGuildId(guildSnowflake)
    if (!guildId) {
        throw new Error('Guild is missing from database')
    }

    try {
        removeNoPingUser(guildId, interaction.user.id)
    } catch (error) {
        console.warn('Failed to unmute reminders:', error)
        await replyWithError(interaction, error, true)
        return
    }
    await interaction.reply({
        content: 'Du kommer bli pingad av framtida påminnelser',
        flags: MessageFlags.Ephemeral,
    })
}
