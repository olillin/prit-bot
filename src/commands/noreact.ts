import {
    MessageFlags,
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { getNoReactChannels, setNoReactChannels } from '../data'
import { CommandMap } from '../types'
import { defineCommand } from '../util'

export default defineCommand({
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
    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString('command', true)

        const commandMap: CommandMap = {
            add,
            remove,
            list,
        }

        commandMap[command](interaction)
    },
})

async function add(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel')
    if (!channel) {
        await interaction.reply({
            content: 'Du måste ange en kanal',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
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
    const channel = interaction.options.getChannel('channel')
    if (!channel) {
        await interaction.reply({
            content: 'Du måste ange en kanal',
            flags: MessageFlags.Ephemeral,
        })
        return
    }
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
                .setColor('#09cdda')
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
