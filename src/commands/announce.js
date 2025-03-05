const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } = require('discord.js')
const { announceWeek } = require('../announce')

module.exports = {
    data: new SlashCommandBuilder().setName('announce').setDescription('Announce demo'),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const success = await announceWeek(interaction.client)

        await interaction.reply({
            content: success ? 'Announcement successful' : 'Announcement failed',
            flags: MessageFlags.Ephemeral,
        })
    },
}
