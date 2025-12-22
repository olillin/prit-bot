import {
    ApplicationCommandOptionType,
    ChannelType,
    Guild,
    PermissionFlagsBits,
} from 'discord.js'
import { AnnounceChannel } from '../types'
import {
    millisecondsToTimeString,
    timeStringToMilliseconds,
} from '../util/dates'
import { canUseRole, getAnnouncementChannel, getRole } from '../util/guild'
import { defineVariable } from './variable'

const Variables = {
    calendar: defineVariable({
        prettyName: 'Länk till kalendern',
        key: 'responsibleCalendarUrl',

        set: {
            optionType: ApplicationCommandOptionType.String,
            optionName: 'url',

            serialize: (value, context) => {
                const urlPattern = /^\w+:\/\/(?:.+?)?(?:\..+?)+$/
                if (!urlPattern.test(value)) {
                    throw new Error('Ogiltig URL')
                }
                return value
            },
        },

        get: {
            deserialize: (value, context) => value,
        },
    }),

    channel: defineVariable({
        prettyName: 'Kanal för utskick',
        key: 'announceChannel',

        set: {
            optionType: ApplicationCommandOptionType.Channel,

            optionExtras: option =>
                option.addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement
                ),

            serialize: (value, context) => {
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
        },
        get: {
            deserialize: async (value, context) => {
                const guild = context.guild!
                const channel = await getAnnouncementChannel(value, guild)
                if (!channel) {
                    throw new Error(
                        'Den sparade kanalen för utskick finns inte längre'
                    )
                }
                return channel.toString()
            },
        },
    }),

    role: defineVariable({
        prettyName: 'Roll som har ansvarsvecka',
        key: 'responsibleRole',

        set: {
            optionType: ApplicationCommandOptionType.Role,
            serialize: async (value, context) => {
                const guild: Guild = context.guild!

                if (!(await canUseRole(guild, value))) {
                    throw new Error(
                        'Den rollen kan inte användas, saknar tillstånd'
                    )
                }

                return value.id
            },
        },
        get: {
            deserialize: async (value, context) => {
                const guild = context.guild!
                const role = await getRole(value, guild)
                if (!role) {
                    throw new Error(
                        'Den sparade rollen för ansvarsvecka finns inte längre'
                    )
                }
                return role.toString()
            },
        },
    }),

    schedulerole: defineVariable({
        prettyName: 'Roll som har ansvar att sätta ansvarsveckor',
        key: 'responsibleResponsibleRole',

        set: {
            optionType: ApplicationCommandOptionType.Role,
            serialize: async (value, context) => {
                const guild: Guild = context.guild!

                if (!(await canUseRole(guild, value))) {
                    throw new Error(
                        'Den rollen kan inte användas, saknar tillstånd'
                    )
                }

                return value.id
            },
        },

        get: {
            deserialize: async (value, context) => {
                const guild = context.guild!
                const role = await getRole(value, guild)
                if (!role) {
                    throw new Error(
                        'Den sparade rollen för den som sätter ansvarsvecka finns inte längre'
                    )
                }
                return role.toString()
            },
        },
    }),

    announcetime: defineVariable({
        prettyName: 'Tid för utskick',
        key: 'announceTime',

        set: {
            optionType: ApplicationCommandOptionType.String,
            serialize: timeStringToMilliseconds,
        },

        get: {
            deserialize: millisecondsToTimeString,
        },
    }),

    reminderstime: defineVariable({
        prettyName: 'Tid för påminnelser',
        key: 'remindersTime',

        set: {
            optionType: ApplicationCommandOptionType.String,
            serialize: timeStringToMilliseconds,
        },

        get: {
            deserialize: millisecondsToTimeString,
        },
    }),
} as const

export default Variables

export type VariableName = keyof typeof Variables
export type SerializedTypeOf<V extends VariableName> =
    (typeof Variables)[V]['set']['optionType']
