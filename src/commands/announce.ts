import {
    type ChatInputCommandInteraction,
    type Guild,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { announceWeekIn } from '../announce'
import { defineCommand } from '../util'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Skicka uppdatering manuellt'),

    async execute(interaction: ChatInputCommandInteraction) {
        const guild: Guild = interaction.guild!
        const success = await announceWeekIn(guild)

        await interaction.reply({
            content: success ? 'Skickat' : 'Misslyckades',
            flags: MessageFlags.Ephemeral,
        })
    },
})
