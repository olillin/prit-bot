import { Channel, Guild } from 'discord.js'
import {
    CommandOptionReturnType,
    CommandOptionWithType,
    SlashCommandOptionTypes,
} from '../util/command'
import { JsonValueOrList } from '../util/json'
import { SerializedTypeOf, VariableName } from './variables'

export interface VariableOptions<
    OptionType extends SlashCommandOptionTypes,
    SerializedType extends JsonValueOrList
> {
    /**
     * The pretty name of the variable used in command descriptions and replies.
     * @example "Link to calendar"
     */
    prettyName: string

    /* The unique key to the variable in the configuration. */
    key: string

    /**
     * Configure how the variable is set.
     */
    set: {
        /** The type of slash command option when setting this variable. */
        optionType: OptionType

        /**
         * The name of the option in the 'set' subcommand. Defaults to command name
         * if unset.
         */
        optionName?: string
        /** Set extra properties for the option like min and max values. */
        optionExtras?: (option: CommandOptionWithType<OptionType>) => void

        /**
         * Convert the option value to a the string value to be saved in the
         * configuration. If the value cannot be used, throw an error with an
         * explanatory message.
         */
        serialize: (
            value: CommandOptionReturnType<OptionType>,
            context: VariableContext
        ) => SerializedType | Promise<SerializedType>
    }

    /**
     * Configure how the variable is fetched.
     */
    get: {
        /**
         * Convert the saved value to a prettified string representation which
         * can be sent to the user.
         */
        deserialize: (
            value: SerializedType,
            context: VariableContext
        ) => string | Promise<string>
    }
}

export function defineVariable<
    OptionType extends SlashCommandOptionTypes,
    SerializedType extends JsonValueOrList
>(
    options: VariableOptions<OptionType, SerializedType>
): VariableOptions<OptionType, SerializedType> {
    return options
}

export interface VariableContext {
    guildId: string | null
    guild: Guild | null
    channelId: string | null
    channel: Channel | null
}

const changeListeners: Map<VariableName, ((value: any | null) => void)[]> =
    new Map()

/**
 * Will be run when the variable is changed or removed.
 * @param value The new value of the configuration property.
 * @param context The interaction that triggered the change.
 */
export function registerChangeListener<V extends VariableName>(
    variable: V,
    listener: (value: SerializedTypeOf<V> | null) => void
) {
    const listeners = changeListeners.get(variable)
    if (listeners === undefined) {
        changeListeners.set(variable, [listener])
    } else {
        listeners.push(listener)
    }
}
