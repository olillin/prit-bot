import {
    getReactionDiscoveredBy,
    addDiscoveredReaction,
    getNoReactChannels,
    getGuildId,
    getReactions,
    getReaction,
} from '../data'
import {
    EmbedBuilder,
    type APIEmbed,
    type EmojiIdentifierResolvable,
    type GuildMember,
    type Message,
} from 'discord.js'

/**
 * Remove the parts of a message that should be ignored when checking reaction
 * patterns.
 * @param message The message content.
 * @returns The message content without the ignored parts.
 */
export function removeIgnoredForReaction(message: string): string {
    // Ignore URLs
    const ignorePattern =
        /\b(?<!@)(?:[a-z]+:\/\/)?(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gm
    return message.replace(ignorePattern, '')
}

/**
 * Check if this message should be reacted to.
 * @param message The mesage to check.
 * @returns true if the message should be reacted to.
 */
export async function canReact(message: Message): Promise<boolean> {
    // Don't add reactions to bot messages
    if (message.author.bot) return false

    // Don't add reactions to long messages
    if (message.content.length > 150) return false

    // Don't react if (parent) channel is marked as a no-react channel
    const guildSnowflake = message.guild?.id
    if (guildSnowflake == undefined) {
        return false
    }

    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        return false
    }

    const noReactChannels = await getNoReactChannels(guildId)
    const channel = message.channel
    if (
        noReactChannels.has(channel.id) ||
        (channel.isThread() &&
            channel.parentId !== null &&
            noReactChannels.has(channel.parentId))
    ) {
        return false
    }

    // Message is okay to react to
    return true
}

/**
 * Adds reaction to a message if it matches any reaction patterns.
 * @param message The message to add reaction to.
 * @returns If any reaction was added.
 */
export async function addReaction(message: Message): Promise<boolean> {
    const reactToMessage = await canReact(message)
    if (!reactToMessage) return false

    const reactions = await getReactions()
    const guild = message.guild
    if (guild === null) {
        throw new Error('Message does not have a guild')
    }

    // Check patterns
    const messageContent = removeIgnoredForReaction(message.content)
    const results = reactions.map(({ id, pattern, emoji }) => {
        const regex = new RegExp(pattern, 'i')
        const match = regex.exec(messageContent)
        if (match) {
            console.log(`Reacting to message with ${emoji.toString()}`)
            message
                .react(emoji)
                .then(() => {
                    console.log('Reacted successfully')

                    return getReactionDiscoveredBy(id, guild)
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
                        `Error occured while reacting with ${emoji.toString()}:`,
                        e
                    )
                    console.trace(e)
                })
        }
        return !!match
    })
    return results.indexOf(true) !== -1
}

/**
 * @param text The text that matched the reaction
 */
async function discoverReaction(
    message: Message,
    text: string,
    reactionId: number
) {
    if (!message.channel.isSendable() || !message.inGuild()) {
        console.error(
            'Failed to send discovery message, channel is not sendable'
        )
        return
    }

    const guildSnowflake = message.guild.id
    const guildId = await getGuildId(guildSnowflake)
    if (guildId === null) {
        throw new Error('Failed to get guild id')
    }

    const reaction = await getReaction(reactionId)
    if (reaction === null) {
        throw new Error('Reaction does not exist')
    }

    const member = message.guild.members.cache.get(message.author.id)
    if (!member) {
        throw new Error('Could not find message author in guild')
    }
    console.log(`New reaction discovered by ${member.toString()}`)

    // Send message
    const embed = discoverReactionEmbed(member, text, reaction.emoji)
    await message.channel.send({ embeds: [embed] })

    // Mark as discovered
    await addDiscoveredReaction(guildId, reactionId, message.author.id)
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
        imageUrl = `https://www.emoji.family/api/emojis/${emoji.toString()}/twemoji/png/128`
    }

    return new EmbedBuilder()
        .setTitle('Ny reaktion upptäckt!')
        .setDescription(
            `${member.toString()} upptäckte en ny reaktion genom att skicka "${text}"!`
        )
        .setColor('#09cdda')
        .setImage(imageUrl).data
}
