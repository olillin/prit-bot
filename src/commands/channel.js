const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, ChannelType, PermissionsBitField, PermissionFlagsBits, SlashCommandStringOption } = require('discord.js')
const { writeData, getData } = require('../data')
const { getAnnouncementChannel } = require('../announce')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel') //
        .setDescription('Hantera uppdateringskanalen')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('What to do')
                .setChoices(
                    { name: 'Skicka uppdateringar i den här kanalen', value: 'set' }, //
                    { name: 'Sluta skicka uppdateringar', value: 'unset' },
                    { name: 'Se var uppdateringar skickas nu', value: 'get' }
                )
                .setRequired(true)
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

    const data = getData()
    data.announceGuild = interaction.guildId
    data.announceChannel = interaction.channelId
    writeData(data)

    await interaction.reply({
        content: 'Framtida uppdateringar kommer skickas i den här kanalen',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function unset(interaction) {
    const data = getData()
    data.announceGuild = undefined
    data.announceChannel = undefined
    writeData(data)

    await interaction.reply({
        content: 'Uppdateringar kommer inte längre skickas',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function get(interaction) {
    const channel = await getAnnouncementChannel(interaction.client)

    if (channel) {
        interaction.reply({
            content: `Uppdateringar skickas i ${channel}`,
            flags: MessageFlags.Ephemeral,
        })
    } else {
        interaction.reply({
            content: 'Uppdateringar skickas inte i någon kanal',
            flags: MessageFlags.Ephemeral,
        })
    }
}
