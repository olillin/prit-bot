const {
    MessageFlags,
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
} = require('discord.js')
const { getGuildData, writeGuildData } = require('../data')
const { getAnnouncementChannel } = require('../data')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noreact') //
        .setDescription('Markera kanaler att inte reagera i')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Markera en kanal', value: 'add' }, //
                    { name: 'Ta bort en markering', value: 'remove' },
                    { name: 'Se vilka kanaler som är markerade', value: 'list' }
                )
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Kanal att (av)markera')
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildForum,
                    ChannelType.PublicThread,
                    ChannelType.PrivateThread
                )
                .setRequired(false)
        ),
    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const command = interaction.options.getString('command', true)

        const commandMap = {
            add,
            remove,
            list,
        }

        commandMap[command](interaction)
    },
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function add(interaction) {
    const channel = interaction.options.getChannel('channel')
    if (!channel) {
        await interaction.reply({
            content: 'Du måste ange en kanal',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    const channelId = channel.id

    /** @type {string} */
    // @ts-ignore
    const guildId = interaction.guildId
    const data = getGuildData(guildId)
    /** @type {Set<string>} */
    // @ts-ignore
    const nonReactChannels = new Set(data.nonReactChannels || [])
    if (nonReactChannels.has(channelId)) {
        await interaction.reply({
            content: 'Kanalen är redan markerad',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    nonReactChannels.add(channelId)
    data.nonReactChannels = nonReactChannels
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Kommer inte längre skicka reaktioner i kanalen ' + channel,
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function remove(interaction) {
    const channel = interaction.options.getChannel('channel')
    if (!channel) {
        await interaction.reply({
            content: 'Du måste ange en kanal',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    const channelId = channel.id

    /** @type {string} */
    // @ts-ignore
    const guildId = interaction.guildId
    const data = getGuildData(guildId)
    /** @type {Set<string>} */
    // @ts-ignore
    const nonReactChannels = new Set(data.nonReactChannels || [])
    if (!nonReactChannels.has(channelId)) {
        await interaction.reply({
            content: 'Kanalen är inte markerad',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    nonReactChannels.delete(channelId)
    data.nonReactChannels = nonReactChannels
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Kommer reagera i kanalen ' + channel,
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function list(interaction) {
    /** @type {string} */
    // @ts-ignore
    const guildId = interaction.guildId
    const data = getGuildData(guildId)
    /** @type {Set<string>} */
    // @ts-ignore
    const nonReactChannels = new Set(data.nonReactChannels || [])

    await interaction.reply({
        content: `Markerade kanaler: ${Array.from(nonReactChannels)}`,
        flags: MessageFlags.Ephemeral,
    })
}
