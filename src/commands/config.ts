import {
    ApplicationCommandOptionType,
    ChannelType,
    Guild,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js'
import { AnnounceChannel } from '../types'
import {
    addConfigurationCommands,
    configurationCommandExecutor,
    ConfigurationCommandOptions,
    defineConfigurationCommand,
} from '../util/command'
import {
    millisecondsToTimeString,
    timeStringToMilliseconds,
} from '../util/dates'
import {
    canUseRole,
    defineCommand,
    getAnnouncementChannel,
    getRole,
} from '../util/guild'
import { announceLoop } from '../features/announcements'
import { remindersLoop } from '../features/reminders'

const commands: ConfigurationCommandOptions<any, any>[] = [
    defineConfigurationCommand({
        type: ApplicationCommandOptionType.String as const,
        key: 'responsibleCalendarUrl' as const,
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
        get: (value, context) => value,
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.Channel as const,
        key: 'announceChannel' as const,
        name: 'channel',
        description: 'Kanal för utskick',

        optionExtras: option =>
            option.addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            ),

        set: (value, context) => {
            const channel = value as AnnounceChannel

            // Check permission
            const permissions = channel.permissionsFor(context.client.user)
            const hasPermission =
                permissions?.has(PermissionFlagsBits.SendMessages) &&
                permissions.has(PermissionFlagsBits.ViewChannel)
            if (!hasPermission) {
                throw new Error(
                    'Den här kanalen kan inte användas för uppdateringar, saknar tillstånd'
                )
            }

            return channel.id
        },
        get: async (value, context) => {
            const guild = context.guild!
            const channel = await getAnnouncementChannel(value, guild)
            if (!channel) {
                throw new Error(
                    'Den sparade kanalen för utskick finns inte längre'
                )
            }
            return channel.toString()
        },
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.Role as const,
        key: 'responsibleRole' as const,
        name: 'role',
        description: 'Roll för ansvarsvecka',

        set: async (value, context) => {
            const guild: Guild = context.guild!

            if (!(await canUseRole(guild, value))) {
                throw new Error(
                    'Den rollen kan inte användas, saknar tillstånd'
                )
            }

            return value.id
        },
        get: async (value, context) => {
            const guild = context.guild!
            const role = await getRole(value, guild)
            if (!role) {
                throw new Error(
                    'Den sparade rollen för ansvarsvecka finns inte längre'
                )
            }
            return role.toString()
        },
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.String as const,
        key: 'announceTime' as const,
        name: 'announcetime',
        description: 'Tid som ansvarsveckor skickas ut',

        set: async (value, context) => {
            try {
                const milliseconds = timeStringToMilliseconds(value)
                return milliseconds
            } catch (e) {
                throw e
            }
        },

        get: async (value, context) => millisecondsToTimeString(value),

        onChange: (value, context) => {
            announceLoop.reset(context.guildId!)
        },
    }),

    defineConfigurationCommand({
        type: ApplicationCommandOptionType.String as const,
        key: 'remindersTime' as const,
        name: 'reminderstime',
        description: 'Tid som påminnelser skickas ut',

        set: async (value, context) => {
            try {
                const milliseconds = timeStringToMilliseconds(value)
                return milliseconds
            } catch (e) {
                throw e
            }
        },

        get: async (value, context) => millisecondsToTimeString(value),

        onChange: (value, context) => {
            remindersLoop.reset(context.guildId!)
        },
    }),
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
