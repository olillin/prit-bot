import { ContainerBuilder, type RGBTuple } from "discord.js"

export const AccentColors = {
    error: [221, 46, 68] as RGBTuple,
    warning: [255, 204, 77] as RGBTuple,
    responsibilityWeeks: [255, 187, 0] as RGBTuple,
}

export function createErrorContainer(message: string): ContainerBuilder {
    return new ContainerBuilder()
        .setAccentColor(AccentColors.error)
        .addTextDisplayComponents(
            text => text.setContent(message)
        )
}

export function createWarningContainer(message: string): ContainerBuilder {
    return new ContainerBuilder()
        .setAccentColor(AccentColors.warning)
        .addTextDisplayComponents(
            text => text.setContent(`:warning: ${message}`)
        )
}