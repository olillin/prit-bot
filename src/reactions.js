const fs = require('fs')

/**
 * @typedef {{
 *   [x: string]: import('discord.js').EmojiIdentifierResolvable
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
            console.warn('Invalid reactions in reactions.json')
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

    Object.entries(reactions).forEach(async ([pattern, emoji]) => {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(message.content)) {
            console.log(`Reacting to message with ${emoji}`)
            message.react(emoji).catch(e => {
                console.warn(`Failed to react to message with ${emoji}: ${e.message}`)
            })
        }
    })
}

module.exports = { getReactions, addReaction }
