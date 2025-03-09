const { MessageFlags, SlashCommandBuilder } = require('discord.js')
const { announceWeekIn } = require('../announce')

module.exports = {
    data: new SlashCommandBuilder().setName('announce').setDescription('Skicka uppdatering manuellt'),

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        /** @type {import('discord.js').Guild} */
        // @ts-ignore
        const guild = interaction.guild
        const success = await announceWeekIn(guild)

        await interaction.reply({
            content: success ? 'Skickat' : 'Misslyckades',
            flags: MessageFlags.Ephemeral,
        })
    },
}
