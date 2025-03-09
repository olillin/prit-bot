const { MessageFlags, SlashCommandBuilder } = require('discord.js')
const { getGuildData, writeGuildData, canUseRole } = require('../data')

module.exports = {
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

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        const command = interaction.options.getString('command', true)

        const commandMap = {
            set,
            unset,
            get,
        }

        commandMap[command](interaction)
    },
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function set(interaction) {
    const role = interaction.options.getRole('role')
    /** @type {import('discord.js').Guild} */
    // @ts-ignore
    const guild = interaction.guild

    if (role === null) {
        await interaction.reply({
            content: 'Du måste ange en roll',
            flags: MessageFlags.Ephemeral,
        })
    }

    if (!(await canUseRole(guild, /** @type {import('discord.js').Role} */ (role)))) {
        await interaction.reply({
            content: 'Den rollen kan inte användas, saknar tillstånd',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const data = getGuildData(guild.id)
    // @ts-ignore
    data.responsibleRole = role.id
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function unset(interaction) {
    /** @type {import('discord.js').Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    data.responsibleRole = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {import('discord.js').ChatInputCommandInteraction} interaction */
async function get(interaction) {
    /** @type {import('discord.js').Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    /** @type {string | undefined} */
    const roleId = data.responsibleRole

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
