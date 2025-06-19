import {
    type ChatInputCommandInteraction,
    type Guild,
    type Role,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js'
import { getGuildData, writeGuildData, canUseRole } from '../data'
import type { CommandMap } from '../types'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Bestäm roll för ansvarsvecka')
        .addStringOption(option =>
            option
                .setName('command') //
                .setDescription('Vad du vill göra')
                .setChoices(
                    { name: 'Sätt roll', value: 'set' }, //
                    { name: 'Ta bort roll', value: 'unset' },
                    { name: 'Se roll', value: 'get' }
                )
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName('role') //
                .setDescription('Rollen som ska användas')
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
    const role = interaction.options.getRole('role')
    const guild: Guild = interaction.guild!

    if (role === null) {
        await interaction.reply({
            content: 'Du måste ange en roll',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    if (!(await canUseRole(guild, role as Role))) {
        await interaction.reply({
            content: 'Den rollen kan inte användas, saknar tillstånd',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const data = getGuildData(guild.id)
    data.responsibleRole = role.id
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

async function unset(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    data.responsibleRole = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

async function get(interaction: ChatInputCommandInteraction) {
    const guild: Guild = interaction.guild!

    const data = getGuildData(guild.id)
    const roleId: string | undefined = data.responsibleRole

    if (!roleId) {
        await interaction.reply({
            content: 'Det finns ingen roll för ansvarsvecka',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const role = await guild.roles.fetch(roleId)
    if (role === null) {
        await interaction.reply({
            content: 'Den sparade rollen för ansvarsvecka finns inte längre',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    await interaction.reply({
        content: `Roll för ansvarsvecka är ${role}`,
        flags: MessageFlags.Ephemeral,
    })
}
