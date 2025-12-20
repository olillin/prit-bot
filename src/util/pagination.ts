import {
    AnyComponent,
    BitField,
    ChatInputCommandInteraction,
    Interaction,
    InteractionReplyOptions,
    MessageFlags,
    MessageFlagsBitField,
} from 'discord.js'
import { Concrete } from '../types'

export interface PaginationOptions {
    flags?: InteractionReplyOptions['flags'] | null
    startPage?: number
}

function defaultOptions(): Concrete<PaginationOptions> {
    return {
        flags: new BitField(),
        startPage: 0,
    }
}

export class Pagination {
    interaction: ChatInputCommandInteraction
    pages: (AnyComponent | AnyComponent[])[]
    options: Concrete<PaginationOptions>

    constructor(
        interaction: ChatInputCommandInteraction,
        pages: AnyComponent[],
        options?: PaginationOptions
    ) {
        this.interaction = interaction
        this.pages = pages
        this.options = Object.assign(defaultOptions(), options ?? {})
    }

    send() {
        this.interaction.reply({
            flags: new MessageFlagsBitField(
                MessageFlagsBitField.Flags.IsComponentsV2
            ).add(this.options.flags),
            components: this.pages[0],
        })
    }
}
