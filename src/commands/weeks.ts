import {
    type ChatInputCommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { defineCommand } from '../util/guild'
import { CommandMap } from '../util/command'
import { distributeMembers } from '../features/weekGeneration'
import { getGuildConfiguration } from '../data'
import { getPreviouslyResponsible } from '../util/weekInfo'

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
    if (!previous) {
        interaction.editReply(
            ':warning: Kunde inte hämta tidigare ansvarsveckor, kontrollera att `/config calendar` är inställt.'
        )
    }
    const previouslyResponsible = previous?.map(week => week.responsible) ?? []

    // Parse slash command options
    const membersPerWeek = interaction.options.getInteger('membersPerWeek') ?? 2

    const membersSet = new Set(members)
    const distributedMembers = distributeMembers(membersSet, previouslyResponsible, membersPerWeek)
    console.log(distributedMembers)

    await interaction.editReply(distributedMembers.map(set => `- ${Array.from(set).join(', ')}`).join('\n'))
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}