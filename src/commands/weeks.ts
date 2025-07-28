import {
    type ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import fs from 'fs'
import { getGuildConfiguration } from '../data'
import { createUrl } from '../features/timesend'
import { createCalendar, createCalendarFile, createEvents, distributeMembers } from '../features/weekGeneration'
import type { CommandMap } from '../util/command'
import { addWeeks, ONE_WEEK, weekNumber } from '../util/dates'
import { defineCommand } from '../util/guild'
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
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    // Parse previous weeks
    const previous = await getPreviouslyResponsible(guildId)
    console.log(previous)
    if (!previous) {
        interaction.editReply(
            ':warning: Kunde inte hämta tidigare ansvarsveckor, kontrollera att `/config calendar` är inställt.'
        )
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
    const timeSendUrl = await createUrl(calendar)

    const messageContent = `Genererade ${events.length} veckor som du kan sätta i din kalender:\n`
        + events.map(event => {
            const week = weekNumber(event.start())
            const members = getNamesFromEventSummary(event.summary())
            return `- v${week}: ${members.join(', ')}`
        }).join('\n')
        + `\n\n[Lägg till i Google Kalender](${timeSendUrl})`

    try {
        await interaction.editReply({
            content: messageContent,
            files: [calendarFile],
        })
    } finally {
        fs.rmSync(calendarFile)
    }
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}