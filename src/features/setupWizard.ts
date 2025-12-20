import {
    AnyComponent,
    AnyComponentV2,
    ContainerBuilder,
    Interaction,
    RGBTuple,
    TextDisplayBuilder,
} from 'discord.js'

const wizardAccentColor: RGBTuple = [89, 249, 97]

export function createWizardPages(ctx: Interaction): AnyComponentV2[] {
    return [
        createPermissionsPage(ctx),
        createSelectFeaturesPage(ctx),
        createCalendarPage(ctx),
        createResponsibilityPage(ctx),
        createRemindersPage(ctx),
        createReactionsPage(ctx),
    ]
}

function wizardContainer(): ContainerBuilder {
    return new ContainerBuilder().setAccentColor(wizardAccentColor)
}

function createPermissionsPage(ctx: Interaction): AnyComponent {
    return wizardContainer().addTextDisplayComponents(textDisplay =>
        textDisplay.setContent('Welcome to the setup wizard!')
    )
}

function createSelectFeaturesPage(ctx: Interaction): AnyComponentV2 {
    return wizardContainer().addTextDisplayComponents(textDisplay =>
        textDisplay.setContent('Features page')
    )
}

function createCalendarPage(ctx: Interaction): AnyComponentV2 {
    return {
        // components: [new TextDisplayBuilder().setContent(
        content: 'Calendar page',
        // )],
    }
}

function createResponsibilityPage(ctx: Interaction): AnyComponentV2 {
    return {
        // components: [ new TextDisplayBuilder().setContent(
        content: 'Responsibility page',
        // ), ],
    }
}

function createRemindersPage(ctx: Interaction): AnyComponentV2 {
    return {
        // components: [new TextDisplayBuilder().setContent(
        content: 'Reminders page',
        // )],
    }
}

function createReactionsPage(ctx: Interaction): AnyComponentV2 {
    return {
        // components: [new TextDisplayBuilder().setContent(
        content: 'Reactions page',
        // )],
    }
}
