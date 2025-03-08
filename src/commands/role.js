const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild } = require('discord.js')
const { getGuildData, writeGuildData, canUseRole } = require('../data')

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
        /** @type {Guild} */
        // @ts-ignore
        const guild = interaction.guild

        // @ts-ignore
        if (role !== null && !(await canUseRole(guild, role))) {
            await interaction.reply({
                content: 'Den rollen kan inte användas, saknar tillstånd',
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        const data = getGuildData(guild.id)
        data.ansvarRole = role?.id
        writeGuildData(guild.id, data)

        await interaction.reply({
            content: 'Roll för ansvarsvecka ' + (role ? 'uppdaterad' : 'borttagen'),
            flags: MessageFlags.Ephemeral,
        })
    },
}
