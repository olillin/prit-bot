const { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, Guild, Role } = require('discord.js')
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

    /** @param {ChatInputCommandInteraction} interaction */
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

/** @param {ChatInputCommandInteraction} interaction */
async function set(interaction) {
    const role = interaction.options.getRole('role')
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    if (role === null) {
        await interaction.reply({
            content: 'Du måste ange en roll',
            flags: MessageFlags.Ephemeral,
        })
    }

    if (!(await canUseRole(guild, /** @type {Role} */ (role)))) {
        await interaction.reply({
            content: 'Den rollen kan inte användas, saknar tillstånd',
            flags: MessageFlags.Ephemeral,
        })
        return
    }

    const data = getGuildData(guild.id)
    // @ts-ignore
    data.ansvarRole = role.id
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka uppdaterad',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function unset(interaction) {
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    data.ansvarRole = undefined
    writeGuildData(guild.id, data)

    await interaction.reply({
        content: 'Roll för ansvarsvecka borttagen',
        flags: MessageFlags.Ephemeral,
    })
}

/** @param {ChatInputCommandInteraction} interaction */
async function get(interaction) {
    /** @type {Guild} */
    // @ts-ignore
    const guild = interaction.guild

    const data = getGuildData(guild.id)
    /** @type {string | undefined} */
    const roleId = data.ansvarRole

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
