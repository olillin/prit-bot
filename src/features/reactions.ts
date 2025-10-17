import fs from 'fs'
import {
    getReactionDiscoveredBy,
    setReactionDiscoveredBy,
    getNoReactChannels,
} from '../data'
import {
    EmbedBuilder,
    type APIEmbed,
    type EmojiIdentifierResolvable,
    type GuildMember,
    type Message,
} from 'discord.js'
import type { ReactionsConfig } from '../types'
import { REACTIONS_FILE } from '../environment'

export function getReactions(): ReactionsConfig {
    if (fs.existsSync(REACTIONS_FILE)) {
        const text = fs.readFileSync(REACTIONS_FILE, 'utf8')

        try {
            const parsed = JSON.parse(text)
            for (const key in parsed) {
                if (key.startsWith('$')) {
                    delete parsed[key]
                }
            }
            return parsed
        } catch (e) {
            console.warn(
                `Failed to parse reactions from ${REACTIONS_FILE}: ${e}`
            )
        }
    }
    return {}
}

/**
 * Adds reaction to a message if it matches any reaction patterns.
 * @param message The message to add reaction to.
 * @returns If any reaction was added.
 */
export async function addReaction(message: Message): Promise<boolean> {
    if (message.author.bot) return false
    // Don't add reactions to long messages
    if (message.content.length > 150) return false

    const reactions = getReactions()
    const guild = message.guild!

    // Don't react if channel is marked
    const noReactChannels = await getNoReactChannels(guild.id)
    if (noReactChannels.has(message.channel.id)) return false

    // Check patterns
    const results = await Promise.all(
        Object.entries(reactions).map(async ([id, { pattern, emoji }]) => {
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
            return !!match
        })
    )
    return results.indexOf(true) !== -1
}

/**
 * @param text The text that matched the reaction
 */
async function discoverReaction(
    message: Message,
    text: string,
    reactionId: string
) {
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
 * @param member Who discovered the reaction
 * @param text The text that triggered the reaction
 */
function discoverReactionEmbed(
    member: GuildMember,
    text: string,
    emoji: EmojiIdentifierResolvable
): APIEmbed {
    const isCustom = emoji.toString().match(/(\d+)>$/)
    let imageUrl: string
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
