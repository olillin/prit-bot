const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild } = require('discord.js')
const { announceWeekIn } = require('../announce')

module.exports = {
    data: new SlashCommandBuilder().setName('announce').setDescription('Skicka uppdatering manuellt'),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        /** @type {Guild} */
        // @ts-ignore
        const guild = interaction.guild
        const success = await announceWeekIn(guild)

        await interaction.reply({
            content: success ? 'Skickat' : 'Misslyckades',
            flags: MessageFlags.Ephemeral,
        })
    },
}
