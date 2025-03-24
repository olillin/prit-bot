const fs = require('fs')
const { getReactionDiscoveredBy, setReactionDiscoveredBy } = require('./data')
const { EmbedBuilder } = require('discord.js')

/**
 * @typedef {{
 *   pattern: string
 *   emoji: import('discord.js').EmojiIdentifierResolvable
 * }} ReactionDefinition
 *
 * @typedef {{
 *   [id: string]: ReactionDefinition
 * }} ReactionConfig
 */

/**
 * @returns {ReactionConfig}
 */
function getReactions() {
    if (fs.existsSync('reactions.json')) {
        const text = fs.readFileSync('reactions.json', 'utf8')

        try {
            const parsed = JSON.parse(text)

            return parsed
        } catch {
            console.warn('Failed to parse reactions.json')
        }
    }
    return {}
}

/**
 *
 * @param {import('discord.js').Message} message
 */
function addReaction(message) {
    if (message.author.bot) return

    const reactions = getReactions()
    const guild = /** @type {import('discord.js').Guild} */ (message.guild)

    Object.entries(reactions).forEach(async ([id, { pattern, emoji }]) => {
        // Skip special keys
        if (id.startsWith('$')) return

        const regex = new RegExp(pattern, 'i')
        const match = regex.exec(message.content)
        if (match) {
            console.log(`Reacting to message with ${emoji}`)
            message
                .react(emoji)
                .then(() => {
                    console.log('Reacted successfully')

                    return getReactionDiscoveredBy(guild, id)
                })
                .then(discovered => {
                    console.log(`Has been discovered: ${!!discovered}`)
                    if (!discovered) {
                        const text = match[0]
                        return discoverReaction(message, text, id)
                    }
                })
                .catch(e => {
                    console.warn(
                        `Error occured while reacting with ${emoji}: ${e.message}`
                    )
                    console.trace(e)
                })
        }
    })
}

/**
 *
 * @param {import('discord.js').Message} message
 * @param {string} text The text that matched the reaction
 * @param {string} reactionId
 */
async function discoverReaction(message, text, reactionId) {
    if (!message.channel.isSendable() || !message.inGuild()) {
        console.error(
            'Failed to send discovery message, channel is not sendable'
        )
        return
    }

    const reactions = await getReactions()
    const { emoji } = reactions[reactionId]

    const member = message.guild.members.cache.get(message.author.id)
    if (!member) {
        throw new Error('Could not find message author in guild')
    }
    console.log(`New reaction discovered by ${member}`)

    // Send message
    const embed = discoverReactionEmbed(member, text, emoji)
    await message.channel.send({ embeds: [embed] })

    // Mark as discovered
    await setReactionDiscoveredBy(
        message.guild.id,
        reactionId,
        message.author.id
    )
}

/**
 *
 * @param {import('discord.js').GuildMember} member Who discovered the reaction
 * @param {string} text The text that triggered the reaction
 * @param {import('discord.js').EmojiIdentifierResolvable} emoji
 * @returns {import('discord.js').APIEmbed}
 */
function discoverReactionEmbed(member, text, emoji) {
    const isCustom = emoji.toString().match(/(\d+)>$/)
    /** @type {string} */
    let imageUrl
    if (isCustom) {
        const id = isCustom[1]
        imageUrl = `https://cdn.discordapp.com/emojis/${id}.webp`
    } else {
        imageUrl = `https://www.emoji.family/api/emojis/${emoji}/twemoji/png/128`
    }

    return new EmbedBuilder()
        .setTitle('Ny reaktion upptäckt!')
        .setDescription(
            `${member} upptäckte en ny reaktion genom att skicka "${text}"!`
        )
        .setColor('#09cdda')
        .setImage(imageUrl).data
}

module.exports = { getReactions, addReaction }
