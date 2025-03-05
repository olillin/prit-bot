const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } = require('discord.js')
const { writeData, getData } = require('../data')

module.exports = {
    data: new SlashCommandBuilder().setName('sethere').setDescription('Skicka framtida uppdateringar här'),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const data = getData()
        data.announceGuild = interaction.guildId
        data.announceChannel = interaction.channelId
        writeData(data)

        await interaction.reply({
            content: 'Framtida uppdateringar kommer skickas i den här kanalen',
            flags: MessageFlags.Ephemeral,
        })
    },
}
