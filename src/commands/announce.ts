import {
    type ChatInputCommandInteraction,
    type Guild,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { announceWeekIn } from '../features/announcements.js'
import { defineCommand } from '../util/guild.js'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Skicka uppdatering manuellt'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild: Guild = interaction.guild!
        interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        })
        const success = await announceWeekIn(guild)

        await interaction.editReply(success ? 'Skickat' : 'Misslyckades')
    },
})
