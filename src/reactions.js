const fs = require('fs')
const { getReactionDiscoveredBy, setReactionDiscoveredBy } = require('./data')

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
    const reactions = getReactions()
    const guild = /** @type {import('discord.js').Guild} */ (message.guild)

    Object.entries(reactions).forEach(async ([id, { pattern, emoji }]) => {
        const regex = new RegExp(pattern, 'i')
        const match = regex.exec(message.content)
        if (match) {
            console.log(`Reacting to message with ${emoji}`)
            message
                .react(emoji)
                .then(() => {
                    const discovered = getReactionDiscoveredBy(guild, id)
                    if (!discovered) {
                        const text = match[0]
                        const member = guild.members.cache.get(message.author.id)
                        if (!member) {
                            throw new Error('Could not find message author in guild')
                        }
                        await discoverReaction(message, match[0], id)
                    }
                })
                .catch(e => {
                    console.warn(
                        `Failed to react to message with ${emoji}: ${e.message}`
                    )
                })
        }
    })
}

/**
 * 
 * @param {import('discord.js').Message} message
 * @param {string} match
 * @param {string} reactionId
 */
async function discoverReaction(message, match, reactionId) {
    const reactions = await getReactions()
    const {pattern, emoji} = reactions[reactionId]

    await setReactionDiscoveredBy(message.guild.id, reactionId, message.author.id)
}

module.exports = { getReactions, addReaction }
