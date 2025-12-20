import {
    ChatInputCommandInteraction,
    ComponentType,
    SlashCommandBuilder,
} from 'discord.js'
import { defineCommand } from '../util/guild'
import { Pagination } from '@discordx/pagination'
import { createWizardPages } from '../features/setupWizard'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('setup') //
        .setDescription('Starta setup wizarden'),

    async execute(interaction: ChatInputCommandInteraction) {
        const pagination = new Pagination(
            interaction,
            createWizardPages(interaction.client),
            {
                ephemeral: true,
            }
        )
        await pagination.send()
    },
})
