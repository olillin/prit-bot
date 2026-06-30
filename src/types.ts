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

export interface GuildConfiguration {
    announceChannel?: string
    responsibleRole?: string
    responsibleResponsibleRole?: string
    responsibleCalendarUrl?: string
    /** Milliseconds after midnight that announcements should be sent */
    announceTime?: number
    /** Milliseconds after midnight that reminders should be sent */
    remindersTime?: number
}

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

export interface RemindersByDay {
    [day: number]: string[]
}
