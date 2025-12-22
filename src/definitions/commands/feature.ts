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
    defineFeatureCommand,
    FeatureCommandOptions,
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

const features: FeatureCommandOptions[] = [
    defineFeatureCommand({
        name: 'announcement',
        description: 'Responsibility week announcement',
    }),

    defineFeatureCommand({
        name: 'responsiblerole',
        description: 'Responsibility week role',
    }),

    defineFeatureCommand({
        name: 'schedulerreminder',
        description: 'Responsibility week scheduler reminder',
    }),

    defineFeatureCommand({
        name: 'reminders',
        description: 'Responsibility week reminders',
    }),

    defineFeatureCommand({
        name: 'reactions',
        description: 'Message reactions',
    }),

    defineFeatureCommand({
        name: 'atchannel',
        description: '@channel response',
    }),
]

export default defineCommand({
    data: (() => {
        const builder = new SlashCommandBuilder()
            .setName('feature')
            .setDescription('Stäng av eller på delar av botten')

        addFeatureCommands(features, builder)

        return builder
    })(),

    execute: featureCommandExecutor(features),
})
