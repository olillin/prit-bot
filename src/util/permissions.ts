import { Guild, PermissionsBitField, PermissionsString } from 'discord.js'
import { CommandDefinition, isCommandDefinition } from './command'

export class MissingPermissionError extends Error {}

export async function getMissingPermissions(
    permissions: PermissionsBitField | CommandDefinition,
    guild: Guild
): Promise<PermissionsString[]> {
    if (isCommandDefinition(permissions)) {
        permissions =
            permissions.requiredPermissions ?? new PermissionsBitField()
    }

    return guild.members
        .fetchMe()
        .then(me => me.permissions.missing(permissions))
}

export async function checkPermissions(
    permissions: PermissionsBitField | CommandDefinition,
    guild: Guild
) {
    const missing = await getMissingPermissions(permissions, guild)

    if (missing.length > 0) {
        throw new MissingPermissionError(
            `Missing required permissions: ${missing}`
        )
    }
}
