import {
    type ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import { defineCommand } from '../util/guild'
import { CommandMap } from '../util/command'
import { distributeMembers } from '../features/weekGeneration'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('weeks')
        .setDescription('Hantera kommande veckor')
        .addSubcommand(subcommand =>
            subcommand
                .setName('generate')
                .setDescription('Generera ansvarsveckor')
                .addIntegerOption(option =>
                    option
                        .setName('start')
                        .setDescription('Från vilken vecka ansvarsveckor ska genereras, antar nästa vecka om inget anges')
                        .setMinValue(1)
                        .setMaxValue(53)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Visa information om kommande veckor')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as
            | 'generate'
            | 'view'

        const commandMap: CommandMap = {
            generate,
            view,
        }

        commandMap[command](interaction)
    },
})

async function generate(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}

async function view(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Unimplemented')
}