import type {
    ChatInputCommandInteraction,
    Client,
    Collection,
    EmojiIdentifierResolvable,
    NewsChannel,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    TextChannel
} from 'discord.js'

export interface ExtendedClient extends Client {
    commands: Collection<string, CommandDefinition>
}

export interface CommandDefinition {
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder
    execute(interaction: ChatInputCommandInteraction): Promise<void>
}


export type CommandData = ReturnType<SlashCommandBuilder["toJSON"]>

export type CommandMap = {
    [command: string]: (
        interaction: ChatInputCommandInteraction
    ) => Promise<void>
}

export type AnnounceChannel = NewsChannel | TextChannel

export interface FullData {
    bookitCookie?: string
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

export interface BookITEventsFTResponse {
    eventsFT: {
        id?: string
        phone?: string
        title?: string
        description?: string
        start?: string
        end?: string
        created_at?: string
        updated_at?: string
        room?: string[]
        booked_by?: string
        booked_as?: string
    }[]
}

export interface BookITEvent {
    id: string
    title: string
    room: string[]
    start: Date
    end: Date
    bookedBy: string
    bookedAs: string
}