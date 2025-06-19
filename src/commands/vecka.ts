import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import { defineCommand } from '../util/guild.js'
import { getCurrentlyResponsible, getStudyWeek, getWeek } from '../util/weekInfo.js'

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
