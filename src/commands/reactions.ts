import {
    EmbedBuilder,
    SlashCommandBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { getDiscoveredReactions } from '../data.js'
import { getReactions } from '../features/reactions.js'
import { defineCommand } from '../util/guild.js'
import { EMBED_COLOR_GENERIC } from '../theme.js'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('reactions') //
        .setDescription('Se upptäckta reaktioner'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return

        const reactions = getReactions()
        const discovered = getDiscoveredReactions(interaction.guild)

        const undiscoveredCount =
            Object.keys(reactions).length - Object.keys(discovered).length

        const discoveredPretty = Object.entries(discovered).map(
            ([id, discoveredBy]) => {
                const { emoji } = reactions[id]
                return `${emoji} **${id}** upptäckt av <@${discoveredBy}>`
            }
        )
        const body =
            discoveredPretty.length > 0
                ? discoveredPretty.join('\n')
                : 'Inga reaktioner har upptäckts'

        const embed = new EmbedBuilder()
            .setTitle('Upptäckta reaktioner')
            .setColor(EMBED_COLOR_GENERIC)
            .setDescription(body)
            .setFooter({
                text: `Det finns ${undiscoveredCount} reaktion${undiscoveredCount == 1 ? '' : 'er'
                    } kvar att upptäcka`,
                iconURL:
                    'https://www.emoji.family/api/emojis/❔/twemoji/png/64',
            }).data

        interaction.reply({ embeds: [embed] })
    },
})
