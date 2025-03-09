const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild, Role } = require('discord.js')
const { getGuildData, writeGuildData, canUseRole } = require('../data')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Hantera kalendern för ansvarsvecka')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Sätt kalender', value: 'set' }, //
                    { name: 'Ta bort kalender', value: 'unset' },
                    { name: 'Se kalender', value: 'get' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('url') //
                .setDescription('URL till kalendern som ska användas')
        ),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const command = interaction.options.getString('command', true)

        const commandMap = {
            set,
            unset,
            get,
        }

        commandMap[command](interaction)
    },
}

/** @param {ChatInputCommandInteraction} interaction */
async function set(interaction) {
    const url = interaction.options.getString('url')
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    if (url === null) {
        await interaction.reply({
            content: 'Du måste ange en URL',
            flags: MessageFlags.Ephemeral,
        })
    }

    const data = getGuildData(guild.id)
    // @ts-ignore
    data.responsibleCalendarUrl = url
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function unset(interaction) {
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    data.responsibleCalendarUrl = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function get(interaction) {
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    /** @type {string | undefined} */
    const url = data.responsibleCalendarUrl

    if (!url) {
        await interaction.reply({
            content: 'Det finns ingen kalender för ansvarsvecka',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    await interaction.reply({
        content: `Kalendern för ansvarsvecka finns på ${url}`,
        flags: MessageFlags.Ephemeral,
    })
}
