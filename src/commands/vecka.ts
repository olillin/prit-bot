import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import { getWeek, getStudyWeek, getResponsibleNicks } from '../util/weekInfo'
import { defineCommand } from '../util/guild'
import { getGuildId } from '../data'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('vecka')
        .setDescription('Information om veckan'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildSnowflake = interaction.guildId
        if (guildSnowflake === null) {
            throw new Error('Guild id is not defined')
        }
        const guildId = await getGuildId(guildSnowflake)
        if (guildId === null) {
            throw new Error('Guild is missing from database')
        }

        const [week, studyWeek, responsible] = await Promise.all([
            getWeek(),
            getStudyWeek(),
            getResponsibleNicks(guildId)
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
