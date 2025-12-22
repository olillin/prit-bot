import type {
    Client,
    Collection,
    EmojiIdentifierResolvable,
    NewsChannel,
    TextChannel,
} from 'discord.js'
import type { CommandDefinition } from './util/command'

export interface ExtendedClient extends Client {
    commands: Collection<string, CommandDefinition>
}

export type AnnounceChannel = NewsChannel | TextChannel

export interface FullData {
    guilds?: {
        [guildId: string]: GuildData
    }
}

export interface GuildData {
    configuration?: GuildConfiguration
    discoveredReactions?: DiscoveredReactionsData
    noReactChannels?: string[]
    reminders?: RemindersData
}

export interface GuildConfiguration {
    variables: 
}

export type ConfigurationKey = keyof GuildConfiguration
export type ConfigurationType<KeyType extends ConfigurationKey> = NonNullable<
    GuildConfiguration[KeyType]
>

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
