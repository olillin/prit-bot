import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import { getWeek, getStudyWeek, getCurrentlyResponsible } from '../weekInfo'
import { defineCommand } from '../util'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('vecka')
        .setDescription('Information om veckan'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId: string = interaction.guildId!
        const [week, studyWeek, responsible] = await Promise.all([
            getWeek(),
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
