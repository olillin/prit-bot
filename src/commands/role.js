const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild } = require('discord.js')
const { announceWeek } = require('../announce')
const { getData, writeData } = require('../data')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Bestäm roll för ansvarsvecka')
        .addRoleOption(option =>
            option
                .setName('role') //
                .setDescription('Rollen som ska användas')
        ),

    /** @param {ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const role = interaction.options.getRole('role')

        const data = getData()
        data.ansvarRole = role?.id
        writeData(data)

        if (role) {
            /** @type {Guild} */
            // @ts-ignore
            const guild = interaction.guild

            guild.roles.edit(role.id, { name: `Ansvartest ${Math.random()}` })
        }

        await interaction.reply({
            content: 'Roll för ansvarsvecka ' + (role ? 'uppdaterad' : 'borttagen'),
            flags: MessageFlags.Ephemeral,
        })
    },
}
