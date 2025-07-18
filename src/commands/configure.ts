import { ChannelType, ChatInputCommandInteraction, Guild, MessageFlags, PermissionFlagsBits, Role, SlashCommandBuilder } from "discord.js"
import { canUseRole, getAnnouncementChannel, getGuildData, writeGuildData } from "../data"
import { AnnounceChannel, CommandTree } from "../types"
import { defineCommand } from "../util/guild"

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('configure')
        .setDescription('Justera bottens inställningar')
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName('calendar')
                .setDescription('Hantera kalendern för ansvarsvecka')
                .addSubcommand(subcommand =>
                    subcommand
                        .setDescription('Sätt länk till kalendern')
                        .setName('set')
                        .addStringOption(option =>
                            option
                                .setName('url')
                                .setDescription('URL till kalendern som ska användas')
                                .setRequired(true)
                        ))
                .addSubcommand(subcommand =>
                    subcommand
                        .setDescription('Ta bort kalendern')
                        .setName('unset'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setDescription('Se länken till kalendern')
                        .setName('get'))
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('channel') //
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
                        .setName('get'))
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('role')
                .setDescription('Hantera roll att ge till de som har ansvarsvecka')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Sätt roll för ansvarsvecka')
                        .addRoleOption(option =>
                            option
                                .setName('role')
                                .setDescription('Rollen som ska användas')
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('unset')
                        .setDescription('Ta bort roll för ansvarsvecka')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('get')
                        .setDescription('Se roll för ansvarsvecka')
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const commandTree: CommandTree = {
            'calendar': {
                'set': calendarSet,
                'unset': calendarUnset,
                'get': calendarGet,
            },
            'channel': {
                'set': channelSet,
                'unset': channelUnset,
                'get': channelGet,
            },
            'role': {
                'set': roleSet,
                'unset': roleUnset,
                'get': roleGet,
            }
        }

        const group = interaction.options.getSubcommandGroup(true)
        const command = interaction.options.getSubcommand(true)

        commandTree[group][command](interaction)
    },
})

async function calendarSet(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url') ?? undefined
    const guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleCalendarUrl = url
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

async function calendarUnset(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleCalendarUrl = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

async function calendarGet(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
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

async function channelSet(interaction: ChatInputCommandInteraction) {
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

async function channelUnset(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!
    const data = getGuildData(guildId)
    data.announceChannel = undefined
    writeGuildData(guildId, data)

    await interaction.reply({
        content: 'Uppdateringar kommer inte längre skickas',
        flags: MessageFlags.Ephemeral,
    })
}

async function channelGet(interaction: ChatInputCommandInteraction) {
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

async function roleSet(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole('role', true)
    const guild: Guild = interaction.guild!

    if (!(await canUseRole(guild, role as Role))) {
        await interaction.reply({
            content: 'Den rollen kan inte användas, saknar tillstånd',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const data = getGuildData(guild.id)
    data.responsibleRole = role.id
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

async function roleUnset(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleRole = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

async function roleGet(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    const roleId: string | undefined = data.responsibleRole

    if (!roleId) {
        await interaction.reply({
            content: 'Det finns ingen roll för ansvarsvecka',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const role = await guild.roles.fetch(roleId)
    if (role === null) {
        await interaction.reply({
            content: 'Den sparade rollen för ansvarsvecka finns inte längre',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    await interaction.reply({
        content: `Roll för ansvarsvecka är ${role}`,
        flags: MessageFlags.Ephemeral,
    })
}
