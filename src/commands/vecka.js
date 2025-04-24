const { SlashCommandBuilder } = require('discord.js')
const {
    getWeek,
    getStudyWeek,
    getCurrentlyResponsible,
} = require('../weekInfo')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vecka')
        .setDescription('Information om veckan'),

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        /** @type {string} */
        // @ts-ignore
        const guildId = interaction.guildId
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
}
