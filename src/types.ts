import type {
    NewsChannel,
    TextChannel,
    ChatInputCommandInteraction,
    EmojiIdentifierResolvable,
} from 'discord.js'

export type CommandMap = {
    [command: string]: (
        interaction: ChatInputCommandInteraction
    ) => Promise<void>
}

export type AnnounceChannel = NewsChannel | TextChannel

export interface FullData {
    guilds?: {
        [guildId: string]: GuildData
    }
}

export interface GuildData {
    announceChannel?: string
    responsibleRole?: string
    responsibleCalendarUrl?: string
    discoveredReactions?: DiscoveredReactionsData
    noReactChannels?: string[]
    reminders?: RemindersData
}

export interface ReactionsDefinition {
    pattern: string
    emoji: EmojiIdentifierResolvable
}

export interface ReactionsConfig {
    [id: string]: ReactionsDefinition
}

export interface DiscoveredReactionsData {
    [id: string]: string
}

export interface RemindersData {
    days?: {
        [day: string]: string[]
    }
    muted?: string[]
}

export interface ParsedRemindersData {
    days: {
        [day: number]: string[]
    }
    muted: string[]
}
