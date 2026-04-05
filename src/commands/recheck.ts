import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { addReaction } from '../features/reactions'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('recheck') //
        .setDescription('Kolla om de senaste meddelandena för reaktioner')
        .addIntegerOption(option =>
            option
                .setName('count')
                .setMinValue(1)
                .setMaxValue(100)
                .setDescription('Antal meddelanden att kolla (standard: 10)')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return

        await interaction.deferReply({
            ephemeral: true,
        })

        const messageLimit = interaction.options.getInteger('count') ?? 10
        const lastMessages = await interaction.channel?.messages.fetch({
            limit: messageLimit,
        })

        if (!lastMessages) {
            await interaction.editReply(
                'Kunde inte hämta meddelanden i den här kanalen.'
            )
            return
        }

        let reactionCount = 0
        lastMessages?.forEach(message => {
            const success = addReaction(message)
            if (success) reactionCount++
        })

        await interaction.editReply(
            `Kollat meddelanden och hittade ${reactionCount} reaktioner.`
        )
    },
})
