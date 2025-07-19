import {
    type ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { defineCommand } from '../util/guild'
import type { CommandMap } from '../util/command'
import { createEvents, distributeMembers } from '../features/weekGeneration'
import { getGuildConfiguration } from '../data'
import { getPreviouslyResponsible } from '../util/weekInfo'
import { addWeeks, ONE_WEEK, weekNumber } from '../util/dates'

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
    console.log(distributedMembers)

    const events = createEvents(distributedMembers, startWeek)

    await interaction.editReply(events.map(event => `- ${event.start()}: ${event.summary()}`).join('\n'))
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}