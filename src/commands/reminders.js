const {
    MessageFlags,
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js')
const {
    addReminder,
    getReminderData,
    removeReminder,
    addReminderMutedUser,
    removeReminderMutedUser,
} = require('../data')
const { announceReminders } = require('../reminders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminders') //
        .setDescription(
            'Hantera påminnelser och stäng av/på pings för dig själv'
        )
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Skapa en ny påminnelse', value: 'add' }, //
                    { name: 'Ta bort en påminnelse', value: 'remove' },
                    { name: 'Se alla påminnelser', value: 'list' },
                    { name: 'Skicka påminnelser igen', value: 'remind' },
                    { name: 'Sluta bli pingad av påminnelser', value: 'mute' },
                    { name: 'Bli pingad av påminnelser', value: 'unmute' }
                )
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('day')
                .setDescription('Dag att hantera påminnelser för')
                .setMinValue(1)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reminder')
                .setDescription(
                    'Påminnelse att lägga till eller index att ta bort'
                )
                .setMinLength(1)
                .setRequired(false)
        ),
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const command = interaction.options.getString('command', true)

        const commandMap = {
            add,
            remove,
            list,
            remind,
            mute,
            unmute,
        }

        commandMap[command](interaction)
    },
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function add(interaction) {
    const day = interaction.options.getInteger('day')
    if (!day) {
        await interaction.reply({
            content: 'Du måste ange vilken dag påminnelsen är för',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    const message = interaction.options.getString('reminder')
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
        content: `Skapade ny påminnelse för dag ${day} med meddelande "${message}"`,
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function remove(interaction) {
    const day = interaction.options.getInteger('day')
    if (!day) {
        await interaction.reply({
            content: 'Du måste ange vilken dag påminnelsen är för',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    // Get index
    const indexString = interaction.options.getString('reminder')
    if (!indexString) {
        await interaction.reply({
            content: 'Du måste ange indexet för påminnelsen du vill ta bort',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    let index
    try {
        index = parseInt(indexString) - 1
        if (index < 0) {
            throw new Error()
        }
    } catch {
        await interaction.reply({
            content: `Ogiltigt index '${indexString}'. Ange ett heltal större än 0`,
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    // Remove correct reminder
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        removeReminder(guildId, day, index)
    } catch (message) {
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    // Success message
    await interaction.reply({
        content: `Tog bort påminnelse med index ${index + 1} för dag ${day}`,
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function list(interaction) {
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
                return {
                    name: `Dag ${day}`,
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

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function remind(interaction) {
    const guild = interaction.guild
    if (!guild) {
        throw new Error('Guild is not defined')
    }
    try {
        await announceReminders(interaction.guild)
    } catch (message) {
        console.error('Failed to announce reminders: ' + message)
        await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    await interaction.reply({
        content: 'Påminnelser skickade!',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function mute(interaction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        addReminderMutedUser(guildId, interaction.user.id)
    } catch (message) {
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

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function unmute(interaction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    try {
        removeReminderMutedUser(guildId, interaction.user.id)
    } catch (message) {
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
