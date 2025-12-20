import { Client, Embed } from 'discord.js'

export enum SetupWizardPage {
    PERMISSIONS,
    SELECT_FEATURES,
    CALENDAR,
    RESPONSIBILITY,
    REMINDERS,
    REACTIONS,
}

export function createPage(client: Client, page: SetupWizardPage): Embed {
    switch (page) {
        case SetupWizardPage.PERMISSIONS:
            return createPermissionsPage(client)
        case SetupWizardPage.SELECT_FEATURES:
            return createSelectFeaturesPage(client)
        case SetupWizardPage.CALENDAR:
            return createCalendarPage(client)
        case SetupWizardPage.RESPONSIBILITY:
            return createResponsibilityPage(client)
        case SetupWizardPage.REMINDERS:
            return createRemindersPage(client)
        case SetupWizardPage.REACTIONS:
            return createReactionsPage(client)
    }
}
function createPermissionsPage(client: Client<boolean>): Embed {}
function createSelectFeaturesPage(client: Client<boolean>): Embed {
    throw new Error('Function not implemented.')
}

function createCalendarPage(client: Client<boolean>): Embed {
    throw new Error('Function not implemented.')
}

function createResponsibilityPage(client: Client<boolean>): Embed {
    throw new Error('Function not implemented.')
}

function createRemindersPage(client: Client<boolean>): Embed {
    throw new Error('Function not implemented.')
}

function createReactionsPage(client: Client<boolean>): Embed {
    throw new Error('Function not implemented.')
}
