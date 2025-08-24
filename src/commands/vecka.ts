import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import {
    getWeek,
    getStudyWeek,
    getCurrentlyResponsible,
} from '../util/weekInfo'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('vecka')
        .setDescription('Information om veckan'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId: string = interaction.guildId!
        const [week, studyWeek, responsible] = await Promise.all([
            getWeek(),
            getStudyWeek(),
            getCurrentlyResponsible(guildId)
                .then(names => {
                    if (!names) return 'Ingen'
                    return names.join(', ')
                })
                .catch(() => 'Kalender saknas'),
        ])

        await interaction.reply(
            `### Vecka ${week}
Läsvecka: ${studyWeek}
Ansvarsvecka: ${responsible}`
        )
    },
})
