import {
    ApplicationCommandOptionBase,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionsBitField,
    SlashCommandAttachmentOption,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandMentionableOption,
    SlashCommandNumberOption,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandRoleOption,
    SlashCommandStringOption,
    SlashCommandSubcommandsOnlyBuilder,
    SlashCommandUserOption,
} from 'discord.js'
import { getGuildConfiguration, setGuildConfiguration } from '../data'
import type { GuildConfiguration } from '../types'

export interface CommandDefinition {
    data:
        | SlashCommandBuilder
        | SlashCommandOptionsOnlyBuilder
        | SlashCommandSubcommandsOnlyBuilder
    execute(interaction: ChatInputCommandInteraction): Promise<void>
    requiredPermissions?: PermissionsBitField
}

export function isCommandDefinition(
    maybeCommandDefinition: Object
): maybeCommandDefinition is CommandDefinition {
    return (
        maybeCommandDefinition.hasOwnProperty('data') &&
        maybeCommandDefinition.hasOwnProperty('execute') &&
        maybeCommandDefinition.hasOwnProperty('requiredPermissions')
    )
}

export type CommandData = ReturnType<SlashCommandBuilder['toJSON']>

export type CommandMap = {
    [command: string]: (
        interaction: ChatInputCommandInteraction
    ) => Promise<void>
}

export type CommandTree = {
    [group: string]: CommandMap
}

export type SlashCommandOptionTypes = Exclude<
    ApplicationCommandOptionType,
    1 | 2
>
export type SlashCommandOptionsBase = {
    [type in SlashCommandOptionTypes]: [
        ApplicationCommandOptionBase,
        keyof ChatInputCommandInteraction['options']
    ]
}
export interface SlashCommandOptions extends SlashCommandOptionsBase {
    3: [SlashCommandStringOption, 'getString']
    4: [SlashCommandIntegerOption, 'getInteger']
    5: [SlashCommandBooleanOption, 'getBoolean']
    6: [SlashCommandUserOption, 'getUser']
    7: [SlashCommandChannelOption, 'getChannel']
    8: [SlashCommandRoleOption, 'getRole']
    9: [SlashCommandMentionableOption, 'getMentionable']
    10: [SlashCommandNumberOption, 'getNumber']
    11: [SlashCommandAttachmentOption, 'getAttachment']
}

export type ConfigurationKey = keyof GuildConfiguration
export type ConfigurationType<KeyType extends ConfigurationKey> = NonNullable<
    GuildConfiguration[KeyType]
>

export type CommandOptionWithType<OptionType extends SlashCommandOptionTypes> =
    SlashCommandOptions[OptionType][0]
export type CommandOptionReturnType<
    OptionType extends SlashCommandOptionTypes
> = NonNullable<
    ReturnType<
        ChatInputCommandInteraction['options'][SlashCommandOptions[OptionType][1]]
    >
>

export interface ConfigurationCommandOptions<
    OptionType extends SlashCommandOptionTypes,
    KeyType extends ConfigurationKey
> {
    /** The type of command option */
    type: OptionType
    /* The key to the value in the configuration */
    key: KeyType

    /** The name of the command */
    name: string
    /**
     * The descriptive name of what this command will set. Used in subcommand
     * descriptions and replies.
     * @example "Link to calendar"
     */
    description: string

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
    set: (
        value: CommandOptionReturnType<OptionType>,
        context: ChatInputCommandInteraction
    ) => ConfigurationType<KeyType> | Promise<ConfigurationType<KeyType>>

    /**
     * Convert the saved value to the string representation which should be sent
     */
    get: (
        value: ConfigurationType<KeyType>,
        context: ChatInputCommandInteraction
    ) => string | Promise<string>

    /**
     * Will be run when the value is changed or removed.
     * @param value The new value of the configuration property.
     * @param context The interaction that triggered the change.
     */
    onChange?: (
        value: ConfigurationType<KeyType> | undefined,
        context: ChatInputCommandInteraction
    ) => void
}

export function defineConfigurationCommand<
    OptionType extends SlashCommandOptionTypes,
    KeyType extends ConfigurationKey
>(
    options: ConfigurationCommandOptions<OptionType, KeyType>
): ConfigurationCommandOptions<OptionType, KeyType> {
    return options
}

export function addConfigurationCommand<
    OptionType extends SlashCommandOptionTypes,
    KeyType extends ConfigurationKey
>(
    command: ConfigurationCommandOptions<OptionType, KeyType>,
    builder: SlashCommandBuilder
) {
    builder.addSubcommandGroup(subcommandGroup =>
        subcommandGroup
            .setName(command.name)
            .setDescription(command.description)
            .addSubcommand(subcommand =>
                subcommand
                    .setName('get')
                    .setDescription(`Hämta värdet på ${command.description}`)
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('unset')
                    .setDescription(`Ta bort värdet på ${command.description}`)
            )
            .addSubcommand(subcommand => {
                subcommand
                    .setName('set')
                    .setDescription(`Ändra värdet på ${command.description}`)
                function setupOption<T extends SlashCommandOptionTypes>(
                    builder: CommandOptionWithType<T>
                ): CommandOptionWithType<T> {
                    builder
                        .setName(command.optionName ?? command.name)
                        .setDescription(command.description)
                        .setRequired(true)
                    if (command.optionExtras) {
                        command.optionExtras(builder)
                    }
                    return builder
                }
                switch (command.type) {
                    case ApplicationCommandOptionType.String:
                        subcommand.addStringOption(
                            setupOption<ApplicationCommandOptionType.String>
                        )
                        break
                    case ApplicationCommandOptionType.Integer:
                        subcommand.addStringOption(
                            setupOption<ApplicationCommandOptionType.String>
                        )
                        break
                    case ApplicationCommandOptionType.Boolean:
                        subcommand.addBooleanOption(
                            setupOption<ApplicationCommandOptionType.Boolean>
                        )
                        break
                    case ApplicationCommandOptionType.User:
                        subcommand.addUserOption(
                            setupOption<ApplicationCommandOptionType.User>
                        )
                        break
                    case ApplicationCommandOptionType.Channel:
                        subcommand.addChannelOption(
                            setupOption<ApplicationCommandOptionType.Channel>
                        )
                        break
                    case ApplicationCommandOptionType.Role:
                        subcommand.addRoleOption(
                            setupOption<ApplicationCommandOptionType.Role>
                        )
                        break
                    case ApplicationCommandOptionType.Mentionable:
                        subcommand.addMentionableOption(
                            setupOption<ApplicationCommandOptionType.Mentionable>
                        )
                        break
                    case ApplicationCommandOptionType.Number:
                        subcommand.addNumberOption(
                            setupOption<ApplicationCommandOptionType.Number>
                        )
                        break
                    case ApplicationCommandOptionType.Attachment:
                        subcommand.addAttachmentOption(
                            setupOption<ApplicationCommandOptionType.Attachment>
                        )
                        break
                }
                return subcommand
            })
    )
}

export function addConfigurationCommands(
    commands: ConfigurationCommandOptions<any, any>[],
    builder: SlashCommandBuilder
) {
    commands.forEach(command => {
        addConfigurationCommand(command, builder)
    })
}

export function getOption<T extends SlashCommandOptionTypes>(
    interaction: ChatInputCommandInteraction,
    name: string,
    type: T
): CommandOptionReturnType<T> {
    switch (type) {
        case ApplicationCommandOptionType.String:
            return interaction.options.getString(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Integer:
            return interaction.options.getInteger(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Boolean:
            return interaction.options.getBoolean(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.User:
            return interaction.options.getUser(
                name,
                true
            ) as unknown as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Channel:
            return interaction.options.getChannel(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Role:
            return interaction.options.getRole(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Mentionable:
            return interaction.options.getMentionable(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Number:
            return interaction.options.getNumber(
                name,
                true
            ) as CommandOptionReturnType<T>
        case ApplicationCommandOptionType.Attachment:
            return interaction.options.getAttachment(
                name,
                true
            ) as unknown as CommandOptionReturnType<T>
    }
}

export async function executeConfigurationCommand<
    OptionType extends SlashCommandOptionTypes,
    KeyType extends ConfigurationKey
>(
    command: ConfigurationCommandOptions<OptionType, KeyType>,
    interaction: ChatInputCommandInteraction
) {
    const subcommand = interaction.options.getSubcommand(true)
    const guildId = interaction.guildId!
    if (subcommand === 'set') {
        const value = getOption(
            interaction,
            command.optionName ?? command.name,
            command.type
        )

        let convertedValue: ConfigurationType<KeyType>
        try {
            convertedValue = await command.set(value, interaction)
        } catch (e) {
            interaction.reply({
                content: (e as Error).message,
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        const configuration = getGuildConfiguration(guildId)
        configuration[command.key] = convertedValue
        setGuildConfiguration(guildId, configuration)

        try {
            const prettyValue = await command.get(convertedValue, interaction)
            interaction.reply({
                content: `${command.description} har uppdaterats till ${prettyValue}`,
                flags: MessageFlags.Ephemeral,
            })
        } catch {
            interaction.reply({
                content: `${command.description} har uppdaterats`,
                flags: MessageFlags.Ephemeral,
            })
        }

        if (command.onChange) command.onChange(convertedValue, interaction)
    } else if (subcommand === 'unset') {
        const configuration = getGuildConfiguration(guildId)
        if (configuration[command.key] === undefined) {
            interaction.reply({
                content: `${command.description} har redan tagits bort`,
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        delete configuration[command.key]
        setGuildConfiguration(guildId, configuration)

        interaction.reply({
            content: `${command.description} har tagits bort`,
            flags: MessageFlags.Ephemeral,
        })

        if (command.onChange) command.onChange(undefined, interaction)
    } else if (subcommand === 'get') {
        const configuration = getGuildConfiguration(guildId)
        const value = configuration[command.key]
        if (!value) {
            interaction.reply({
                content: `${command.description} saknas`,
                flags: MessageFlags.Ephemeral,
            })
            return
        }

        try {
            const prettyValue = await command.get(value, interaction)
            interaction.reply({
                content: `${command.description} har värdet ${prettyValue}`,
                flags: MessageFlags.Ephemeral,
            })
        } catch (e) {
            interaction.reply({
                content: (e as Error).message,
                flags: MessageFlags.Ephemeral,
            })
        }
    } else {
        interaction.reply({
            content: `Ett oväntat fel inträffade. Ogiltigt subkommando`,
            flags: MessageFlags.Ephemeral,
        })
    }
}

export function configurationCommandExecutor(
    commands: ConfigurationCommandOptions<any, any>[]
): (interaction: ChatInputCommandInteraction) => Promise<void> {
    return async (interaction: ChatInputCommandInteraction) => {
        const subcommandGroup = interaction.options.getSubcommandGroup(true)
        const command = commands.find(
            command => command.name === subcommandGroup
        )
        if (!command) {
            await interaction.reply({
                content: 'Okänt kommando',
                flags: MessageFlags.Ephemeral,
            })
            return
        }
        executeConfigurationCommand(command, interaction)
    }
}
