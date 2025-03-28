const { MessageFlags, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js')
const { getGuildData, writeGuildData } = require('../data')
const { getAnnouncementChannel } = require('../data')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel') //
        .setDescription('Hantera uppdateringskanalen')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Skicka uppdateringar i den här kanalen', value: 'set' }, //
                    { name: 'Sluta skicka uppdateringar', value: 'unset' },
                    { name: 'Se var uppdateringar skickas nu', value: 'get' }
                )
                .setRequired(true)
        ),

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
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

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function set(interaction) {
    const correctChannelType = interaction.channel?.type === ChannelType.GuildText || interaction.channel?.type === ChannelType.GuildAnnouncement
    if (!correctChannelType) {
        await interaction.reply({
            content: 'Den här kanalen kan inte användas för uppdateringar, fel typ',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const permissions = interaction.channel.permissionsFor(interaction.client.user)
    const hasPermission = permissions?.has(PermissionFlagsBits.SendMessages) && permissions.has(PermissionFlagsBits.ViewChannel)
    if (!hasPermission) {
        await interaction.reply({
            content: 'Den här kanalen kan inte användas för uppdateringar, saknar tillstånd',
        })
        return
    }

    /** @type {string} */
    // @ts-ignore
    const guildId = interaction.guildId
    const data = getGuildData(guildId)
    data.announceChannel = interaction.channelId
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Framtida uppdateringar kommer skickas i den här kanalen',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function unset(interaction) {
    /** @type {string} */
    // @ts-ignore
    const guildId = interaction.guildId
    const data = getGuildData(guildId)
    data.announceChannel = undefined
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Uppdateringar kommer inte längre skickas',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function get(interaction) {
    /** @type {import('discord.js').Guild} */
    // @ts-ignore
    const guild = interaction.guild
    const channel = await getAnnouncementChannel(guild)

    if (channel) {
        interaction.reply({
            content: `Uppdateringar skickas i ${channel}`,
            flags: MessageFlags.Ephemeral,
        })
    } else {
        interaction.reply({
            content: 'Det finns ingen kanal för uppdateringar',
            flags: MessageFlags.Ephemeral,
        })
    }
}
