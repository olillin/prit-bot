import {
    type ChatInputCommandInteraction,
    type Guild,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { getGuildData, writeGuildData } from '../data.js'
import type { CommandMap } from '../types.js'
import { defineCommand } from '../util/guild.js'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Hantera kalendern för ansvarsvecka')
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Sätt länk till kalendern')
                .setName('set')
                .addStringOption(option =>
                    option
                        .setName('url')
                        .setDescription('URL till kalendern som ska användas')
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Ta bort kalendern')
                .setName('unset'))
        .addSubcommand(subcommand =>
            subcommand
                .setDescription('Se länken till kalendern')
                .setName('get')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getSubcommand() as 'set' | 'unset' | 'get'

        const commandMap: CommandMap = {
            set,
            unset,
            get,
        }

        commandMap[command](interaction)
    },
})

async function set(interaction: ChatInputCommandInteraction) {
    const url = interaction.options.getString('url') ?? undefined
    const guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleCalendarUrl = url
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

async function unset(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleCalendarUrl = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Kalender för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

async function get(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    const url = data.responsibleCalendarUrl

    if (!url) {
        await interaction.reply({
            content: 'Det finns ingen kalender för ansvarsvecka',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    await interaction.reply({
        content: `Kalendern för ansvarsvecka finns på ${url}`,
        flags: MessageFlags.Ephemeral,
    })
}
