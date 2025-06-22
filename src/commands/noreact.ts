import {
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { getNoReactChannels, setNoReactChannels } from '../data.js'
import type { CommandMap } from '../types.js'
import { defineCommand } from '../util/guild.js'
import { EMBED_COLOR_GENERIC } from '../theme.js'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('noreact') //
        .setDescription('Markera kanaler att inte reagera i')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Markera en kanal')
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
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Ta bort en markering')
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
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Se vilka kanaler som är markerade')),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as 'add' | 'remove' | 'list'

        const commandMap: CommandMap = {
            add,
            remove,
            list,
        }

        commandMap[command](interaction)
    },
})

async function add(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    const channelId = channel.id
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }

    const noReactChannels = await getNoReactChannels(guildId)
    if (noReactChannels.has(channelId)) {
        await interaction.reply({
            content: 'Kanalen är redan markerad',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    noReactChannels.add(channelId)
    await setNoReactChannels(guildId, noReactChannels)

    await interaction.reply({
        content: `Kommer inte längre skicka reaktioner i kanalen <#${channelId}>`,
        flags: MessageFlags.Ephemeral,
    })
}

async function remove(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    const channelId = channel.id

    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }
    const noReactChannels = await getNoReactChannels(guildId)
    if (!noReactChannels.has(channelId)) {
        await interaction.reply({
            content: 'Kanalen är inte markerad',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
    noReactChannels.delete(channelId)
    await setNoReactChannels(guildId, noReactChannels)

    await interaction.reply({
        content: `Kommer reagera i kanalen <#${channelId}>`,
        flags: MessageFlags.Ephemeral,
    })
}

async function list(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId
    if (!guildId) {
        throw new Error('Guild id is not defined')
    }
    const noReactChannels = await getNoReactChannels(guildId)

    await interaction.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('Markerade kanaler')
                .setColor(EMBED_COLOR_GENERIC)
                .setDescription(
                    noReactChannels.size === 0
                        ? 'Inga kanaler markerade'
                        : Array.from(noReactChannels)
                            .map(id => `- <#${id}>`)
                            .join('\n')
                ),
        ],
        flags: MessageFlags.Ephemeral,
    })
}
