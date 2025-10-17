import {
    SlashCommandBuilder,
    EmbedBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { getDiscoveredReactions } from '../data'
import { addReaction, getReactions } from '../features/reactions'
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

        const reactions = getReactions()

        interaction.deferReply({
            ephemeral: true,
        })

        const lastMessages = await interaction.channel?.messages.fetch({
            limit: interaction.options.getInteger('count') ?? 10,
        })

        if (!lastMessages) {
            interaction.editReply(
                'Kunde inte hämta meddelanden i den här kanalen.'
            )
            return
        }

        let reactionCount = 0
        await Promise.all(
            lastMessages?.map(async message => {
                const success = await addReaction(message)
                if (success) reactionCount++
            })
        )

        interaction.editReply(
            `Kollat meddelanden och hittade ${reactionCount} reaktioner.`
        )
    },
})
