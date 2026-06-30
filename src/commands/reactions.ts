import {
    SlashCommandBuilder,
    EmbedBuilder,
    type ChatInputCommandInteraction,
} from 'discord.js'
import { getDiscoveredReactions, getGuildId, getReactions } from '../data'
import { defineCommand } from '../util/guild'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('reactions') //
        .setDescription('Se upptäckta reaktioner'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return

        const guildSnowflake = interaction.guildId
        if (guildSnowflake === null) {
            throw new Error('Guild id is not defined')
        }
        const guildId = await getGuildId(guildSnowflake)
        if (guildId === null) {
            throw new Error('Guild is missing from database')
        }

        const reactions = await getReactions()
        const discovered = await getDiscoveredReactions(guildId)

        const undiscoveredCount = reactions.length - discovered.length

        const discoveredPretty = discovered.map(
            ({ id, emoji, discoveredBy }) => {
                return `${emoji.toString()} **${id}** upptäckt av <@${discoveredBy}>`
            }
        )
        const body =
            discoveredPretty.length > 0
                ? discoveredPretty.join('\n')
                : 'Inga reaktioner har upptäckts'

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

        await interaction.reply({ embeds: [embed] })
    },
})
