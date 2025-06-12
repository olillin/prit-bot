import {
    type ChatInputCommandInteraction,
    type Guild,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { getGuildData, writeGuildData } from '../data'
import { CommandMap } from '../types'
import { defineCommand } from '../util'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('calendar')
        .setDescription('Hantera kalendern för ansvarsvecka')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Sätt kalender', value: 'set' }, //
                    { name: 'Ta bort kalender', value: 'unset' },
                    { name: 'Se kalender', value: 'get' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('url') //
                .setDescription('URL till kalendern som ska användas')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const command = interaction.options.getString('command', true)

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

    if (url === null) {
        await interaction.reply({
            content: 'Du måste ange en URL',
            flags: MessageFlags.Ephemeral,
        })
    }

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
