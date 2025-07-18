import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import { getStudyWeek, getCurrentlyResponsible } from '../util/weekInfo'
import { defineCommand } from '../util/guild'
import { weekNumber } from '../util/dates'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('vecka')
        .setDescription('Information om veckan'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId: string = interaction.guildId!
        const [week, studyWeek, responsible] = await Promise.all([
            weekNumber(),
            getStudyWeek(),
            getCurrentlyResponsible(guildId).then(names => {
                if (!names) return 'Saknas'
                return names.join(', ')
            }),
        ])

        await interaction.reply(
            `### Vecka ${week}
Läsvecka: ${studyWeek}
Ansvarsvecka: ${responsible}`
        )
    },
})
