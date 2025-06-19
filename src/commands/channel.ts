import {
    MessageFlags,
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
    GuildTextBasedChannel,
} from 'discord.js'
import { getGuildData, writeGuildData, getAnnouncementChannel } from '../data'
import type { AnnounceChannel, CommandMap } from '../types'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('channel') //
        .setDescription('Hantera uppdateringskanalen')
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Sätt uppdateringskanalen')
                .setName('set')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('Kanal att skicka uppdateringar i')
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement,
                        )
                        .setRequired(true)

                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Skicka inte uppdateringar i någon kanal')
                .setName('unset'))
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Se vart uppdateringar skickas nu')
                .setName('get')),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as 'set' | 'unset' | 'get'

        const commandMap: CommandMap = {
            set,
            unset,
            get,
        }

        commandMap[command](interaction)
    },
})

async function set(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true) as AnnounceChannel

    const permissions = channel.permissionsFor(
        interaction.client.user
    )
    const hasPermission =
        permissions?.has(PermissionFlagsBits.SendMessages) &&
        permissions.has(PermissionFlagsBits.ViewChannel)
    if (!hasPermission) {
        await interaction.reply({
            content:
                'Den här kanalen kan inte användas för uppdateringar, saknar tillstånd',
        })
        return
    }

    const guildId: string = interaction.guildId!
    const data = getGuildData(guildId)
    data.announceChannel = channel.id
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Framtida uppdateringar kommer skickas i den här kanalen',
        flags: MessageFlags.Ephemeral,
    })
}

async function unset(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!
    const data = getGuildData(guildId)
    data.announceChannel = undefined
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Uppdateringar kommer inte längre skickas',
        flags: MessageFlags.Ephemeral,
    })
}

async function get(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!
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
