import { ButtonInteraction } from 'discord.js'
import { expandSummaryMessage } from '../features/bookit.js'

export async function executeButtonInteraction(interaction: ButtonInteraction) {
    if (interaction.message.author.id !== interaction.client.user.id) {
        // Not my button, do nothing
        return
    }

    switch (interaction.customId) {
        case 'bookit-show-more':
            await expandSummaryMessage(interaction)
            break
    }
}