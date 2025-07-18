import { ApplicationCommandOptionType, ChannelType, type Guild, PermissionFlagsBits, SlashCommandBuilder } from "discord.js"
import { addConfigurationCommands, configurationCommandExecutor, ConfigurationCommandOptions, defineConfigurationCommand } from "../util/command"
import { canUseRole, defineCommand, getAnnouncementChannel, getRole } from "../util/guild"
import type { AnnounceChannel } from "../data"
import { getCurrentMembers } from "../util/scrape"

const commands: ConfigurationCommandOptions<any>[] = [
    defineConfigurationCommand({
        type: ApplicationCommandOptionType.String as const,
        key: 'responsibleCalendarUrl',
        name: 'calendar',
        description: 'Länk till kalendern',

        optionName: 'url',

        set: (value, context) => {
            const urlPattern = /^\w+:\/\/(?:.+?)?(?:\..+?)+$/
            if (!urlPattern.test(value)) {
                throw new Error('Ogiltig URL')
            }
            return value
        },
        get: (value, context) => value
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.Channel as const,
        key: 'announceChannel',
        name: 'channel',
        description: 'Kanal för utskick',

        optionExtras: (option) =>
            option
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement,
                ),

        set: (value, context) => {
            const channel = value as AnnounceChannel

            // Check permission
            const permissions = channel.permissionsFor(context.client.user)
            const hasPermission =
                permissions?.has(PermissionFlagsBits.SendMessages) &&
                permissions.has(PermissionFlagsBits.ViewChannel)
            if (!hasPermission) {
                throw new Error('Den här kanalen kan inte användas för uppdateringar, saknar tillstånd')
            }

            return channel.id
        },
        get: async (value, context) => {
            const guild = context.guild!
            const channel = await getAnnouncementChannel(value, guild)
            if (!channel) {
                throw new Error('Den sparade kanalen för utskick finns inte längre')
            }
            return channel.toString()
        }
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.Role as const,
        key: 'responsibleRole',
        name: 'role',
        description: 'Roll för ansvarsvecka',

        set: async (value, context) => {
            const guild: Guild = context.guild!

            if (!(await canUseRole(guild, value))) {
                throw new Error('Den rollen kan inte användas, saknar tillstånd')
            }

            return value.id
        },
        get: async (value, context) => {
            const guild = context.guild!
            const role = await getRole(value, guild)
            if (!role) {
                throw new Error('Den sparade rollen för ansvarsvecka finns inte längre')
            }
            return role.toString()
        }
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.String as const,
        name: 'members',
        key: 'members',
        description: 'Sittande medlemmar',

        optionExtras: (option) =>
            option.setDescription('Lista av sittande separerat av komma-tecken. Ange `auto` för nuvarande sittande från chalmers.it'),

        set: async (value, context) => {
            let members: string[]
            if (value.trim().toLowerCase() === 'auto') {
                // Fetch from chalmers.it
                members = await getCurrentMembers()
            } else {
                members = value.split(',').map(name => name.trim())
            }
            return members.join(',')
        },
        get: async (value, context) => {
            return value.replace(/(?<=,)/g, ' ')
        }

    })
]

export default defineCommand({
    data: (() => {
        const builder = new SlashCommandBuilder()
            .setName('config')
            .setDescription('Justera bottens inställningar')

        addConfigurationCommands(commands, builder)

        return builder
    })(),

    execute: configurationCommandExecutor(commands),
})