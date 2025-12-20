import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('setup') //
        .setDescription('Starta setup wizarden'),

    async execute(interaction: ChatInputCommandInteraction) {},
})
