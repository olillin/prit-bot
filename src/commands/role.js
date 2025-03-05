const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild } = require('discord.js')
const { announceWeek } = require('../announce')
const { getData, writeData, canUseRole } = require('../data')

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

        // @ts-ignore
        if (!(await canUseRole(interaction.guild, role))) {
            await interaction.reply({
                content: 'Den rollen kan inte användas, saknar tillstånd',
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        const data = getData()
        data.ansvarRole = role?.id
        writeData(data)

        await interaction.reply({
            content: 'Roll för ansvarsvecka ' + (role ? 'uppdaterad' : 'borttagen'),
            flags: MessageFlags.Ephemeral,
        })
    },
}
