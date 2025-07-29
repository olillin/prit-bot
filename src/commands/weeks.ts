import {
    ButtonBuilder,
    ButtonStyle,
    type ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    SlashCommandBuilder,
    TextDisplayBuilder
} from 'discord.js'
import fs from 'fs'
import { getGuildConfiguration } from '../data'
import { createUrl } from '../features/timesend'
import { createCalendar, createCalendarFile, createEvents, distributeMembers } from '../features/weekGeneration'
import type { CommandMap } from '../util/command'
import { addWeeks, ONE_WEEK, weekNumber } from '../util/dates'
import { defineCommand } from '../util/guild'
import { AccentColors, createWarningContainer } from '../util/theme'
import { getNamesFromEventSummary, getPreviouslyResponsible } from '../util/weekInfo'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('weeks')
        .setDescription('Hantera kommande veckor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('Generera ansvarsveckor')
                .addIntegerOption(option =>
                    option
                        .setName('start')
                        .setDescription('Från vilken vecka ansvarsveckor ska genereras, antar nästa vecka utan ansvarsvecka om inget anges')
                        .setMinValue(1)
                        .setMaxValue(53)
                )
                .addIntegerOption(option =>
                    option
                        .setName('perweek')
                        .setDescription('Hur många personer som ska ha ansvarsvecka varje vecka, antar 2 om inget anges')
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Visa information om kommande veckor')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as
            | 'generate'
            | 'view'

        const commandMap: CommandMap = {
            generate,
            view,
        }

        commandMap[command](interaction)
    },
})

async function generate(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!
    const members = getGuildConfiguration(guildId).members?.split(',')

    if (!members) {
        interaction.reply({
            content: 'Du måste ställa in sittande innan du kan göra detta. Använd `/config members set`',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    await interaction.deferReply({
        flags: [MessageFlags.Ephemeral]
    })

    // Parse previous weeks
    const previous = await getPreviouslyResponsible(guildId)
    console.log(previous)
    if (!previous) {
        interaction.editReply({
            components: [createWarningContainer('Kunde inte hämta tidigare ansvarsveckor, kontrollera att `/config calendar` är inställt.')],
            flags: MessageFlags.IsComponentsV2,
        })
    }
    const previouslyResponsible = previous?.map(week => week.responsible) ?? []

    // Parse slash command options
    let startWeek: number
    if (interaction.options.getInteger('start') !== null) {
        startWeek = interaction.options.getInteger('start')!
    } else {
        const now = new Date()
        const thisWeek = weekNumber(now)
        const latestResponsibleWeek = previous && previous.length > 0
            ? previous[previous.length - 1].start
            : undefined

        if (latestResponsibleWeek && latestResponsibleWeek.getTime() + ONE_WEEK > now.getTime()) {
            startWeek = addWeeks(weekNumber(latestResponsibleWeek), 1, latestResponsibleWeek.getFullYear())
        } else {
            startWeek = thisWeek
        }
    }
    const membersPerWeek = interaction.options.getInteger('perweek') ?? 2

    const membersSet = new Set(members)
    const distributedMembers = distributeMembers(membersSet, previouslyResponsible, membersPerWeek)

    const events = createEvents(distributedMembers, startWeek)

    // Send response
    const calendar = createCalendar(events)
    const calendarFile = createCalendarFile(calendar)
    const calendarFileName = 'ansvarsveckor.ical'
    try {
        let timeSendUrl: string | null
        try {
            timeSendUrl = await createUrl(calendar)
        } catch (e) {
            console.warn(`Failed to generate TimeSend URL: ${e}`)
            timeSendUrl = null
        }

        const weeksSummary = events.map(event => {
            const week = weekNumber(event.start())
            const members = getNamesFromEventSummary(event.summary())
                .map(member => `**${member}**`)
            return `v${week}: ${members.join(', ')}`
        }).join('\n')

        const containerBuilder = new ContainerBuilder()
            .setAccentColor(AccentColors.responsibilityWeeks)
            .addTextDisplayComponents(
                text => text
                    .setContent(
                        `## Genererade ${events.length} ansvarsveckor från v${startWeek}\n${weeksSummary}`
                    )
            )
            .addSeparatorComponents(
                separator => separator.setDivider(true)
            )

        if (timeSendUrl) {
            containerBuilder
                .addTextDisplayComponents(
                    text => text.setContent('Klicka på knappen nedan för att lägga till i Google Kalender')
                )
                .addActionRowComponents(
                    actionRow => actionRow
                        .setComponents(
                            new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Lägg till i Google Kalender')
                                .setURL(timeSendUrl)
                        )
                )
                .addSeparatorComponents(
                    separator => separator.setDivider(false)
                )
        }

        containerBuilder
            .addTextDisplayComponents(
                text => text.setContent(`${timeSendUrl ? 'eller ladda' : 'Ladda'} ner denna fil för att importera i valfri kalenderapp`)
            )
            .addFileComponents(
                file => file.setURL(`attachment://${calendarFileName}`)
            )

        await interaction.editReply({
            components: [containerBuilder],
            files: [{
                attachment: calendarFile,
                name: calendarFileName,
            }],
            flags: MessageFlags.IsComponentsV2,
        })
    } finally {
        fs.rmSync(calendarFile)
    }
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}