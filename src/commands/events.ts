import {
    type ChatInputCommandInteraction,
    type Guild,
    MessageFlags,
    SlashCommandBuilder
} from 'discord.js'
import { createEventMessage, getFutureEvents } from '../features/bookit.js'
import { defineCommand } from '../util/guild.js'

export default defineCommand({
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Få info om kommande arrangemang i Hubben')
        .addIntegerOption(option => option
            .setName('count')
            .setDescription('Hur många arr som ska visas')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const count = interaction.options.getInteger('count') ?? 3

        const guild: Guild = interaction.guild!
        await interaction.deferReply()

        const events = await getFutureEvents(count)
        const messageOptions = await Promise.all(events.map(event => createEventMessage(guild, event)))


        if (messageOptions.length === 0) {
            await interaction.editReply('Det finns inga arrangemang de kommande 2 veckorna')
            return
        } else {
            await interaction.editReply(`Skickar info om ${messageOptions.length} arrangemang`)
        }

        if (interaction.channel?.isSendable()) {
            for (const message of messageOptions) {
                await interaction.channel.send(message)
            }
        } else {
            console.error('Unable to send events, channel is not sendable')
        }
    },
})
