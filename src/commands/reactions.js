const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require('discord.js')
const { getDiscoveredReactions } = require('../data')
const { getReactions } = require('../reactions')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactions') //
        .setDescription('Se upptäckta reaktioner'),

    /** @param {import('discord.js').ChatInputCommandInteraction} interaction */
    async execute(interaction) {
        if (!interaction.guild) return

        const reactions = getReactions()
        const discovered = getDiscoveredReactions(interaction.guild)

        const undiscoveredCount =
            Object.keys(reactions).length - Object.keys(discovered).length

        const body = Object.entries(discovered)
            .map(([id, discoveredBy]) => {
                const { emoji } = reactions[id]
                return `${emoji} **${id}** upptäckt av <@${discoveredBy}>`
            })
            .join('\n')

        const embed = new EmbedBuilder()
            .setTitle('Upptäckta reaktioner')
            .setColor('#09cdda')
            .setDescription(body)
            .setFooter({
                text: `Det finns ${undiscoveredCount} reaktion${
                    undiscoveredCount == 1 ? '' : 'er'
                } kvar att upptäcka`,
                iconURL:
                    'https://www.emoji.family/api/emojis/❔/twemoji/png/64',
            }).data

        interaction.reply({ embeds: [embed] })
    },
}
