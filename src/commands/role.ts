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
        .setDescription('Hantera roll att ge till de som har ansvarsvecka')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Sätt roll för ansvarsvecka')
                .addRoleOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rollen som ska användas')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unset')
                .setDescription('Ta bort roll för ansvarsvecka')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Se roll för ansvarsvecka')
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
    const role = interaction.options.getRole('role', true)
    const guild: Guild = interaction.guild!

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
