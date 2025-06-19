import {
    EmbedBuilder,
    type APIEmbed,
    type EmojiIdentifierResolvable,
    type GuildMember,
    type Message,
} from 'discord.js'
import fs from 'fs'
import {
    getNoReactChannels,
    getReactionDiscoveredBy,
    setReactionDiscoveredBy,
} from '../data.js'
import { REACTIONS_FILE } from '../environment.js'
import type { ReactionsConfig } from '../types.js'

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
            console.warn(`Failed to parse reactions from ${REACTIONS_FILE}: ${e}`)
        }
    }
    return {}
}

export async function addReaction(message: Message) {
    if (message.author.bot) return

    const reactions = getReactions()
    const guild = message.guild!

    // Don't react if channel is marked
    const noReactChannels = await getNoReactChannels(guild.id)
    if (noReactChannels.has(message.channel.id)) return

    // Check patterns
    Object.entries(reactions).forEach(async ([id, { pattern, emoji }]) => {
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
