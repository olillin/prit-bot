const { SlashCommandBuilder } = require('discord.js')
const { getWeek, getStudyWeek, getCurrentlyResponsible } = require('../weekInfo')

module.exports = {
    data: new SlashCommandBuilder().setName('vecka').setDescription('Information om veckan'),

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        /** @type {import('discord.js').Guild} */
        // @ts-ignore
        const guild = interaction.guild
        const [week, studyWeek, responsible] = await Promise.all([
            getWeek(),
            getStudyWeek(),
            getCurrentlyResponsible(guild).then(names => {
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
