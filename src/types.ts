import type {
    Client,
    Collection,
    EmojiIdentifierResolvable,
    NewsChannel,
    TextChannel,
} from 'discord.js'
import type { CommandDefinition } from './util/command'

export type MaybePromise<T> = T | Promise<T>

export interface ExtendedClient extends Client {
    commands: Collection<string, CommandDefinition>
}

export type AnnounceChannel = NewsChannel | TextChannel

export interface Reaction {
    id: number
    displayName: string
    pattern: string
    emoji: EmojiIdentifierResolvable
}

export interface DiscoveredReaction extends Reaction {
    /** Snowflake of user who discovered the reaction. */
    discoveredBy: string
}

export interface Reminder {
    id: number
    message: string
}

export interface RemindersByDay {
    [day: number]: Reminder[]
}
