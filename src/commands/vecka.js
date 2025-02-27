const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js')
const { vecka, lasVecka, ansvarsVecka } = require('../weekInfo')

module.exports = {
    data: new SlashCommandBuilder().setName('vecka').setDescription('Information om veckan'),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const [week, lv, ansvar] = await Promise.all([
            vecka(),
            lasVecka(),
            ansvarsVecka().then(names => {
                if (!names) return 'Saknas'
                return names.join(', ')
            }),
        ])

        await interaction.reply(
            `### Vecka ${week}
Läsvecka: ${lv}
Ansvarsvecka: ${ansvar}`
        )
    },
}
