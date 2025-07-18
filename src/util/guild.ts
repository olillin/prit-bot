import { type APIRole, PermissionFlagsBits, type Role, type Guild, type GuildMember } from 'discord.js'
import type { AnnounceChannel } from '../data'
import type { CommandDefinition } from './command'

/** Get a user in a guild from their nick */

export async function getUser(
    guild: Guild,
    nick: string
): Promise<GuildMember | undefined> {
    const members = await guild.members.fetch()
    for (const [, member] of members) {
        const discordNickname = (
            member.nickname ?? member.user.displayName
        ).toLowerCase()
        if (discordNickname.includes(nick.toLowerCase())) {
            return member
        }
    }
}

export function getUsers(
    nicks: string[],
    guild: Guild
): Promise<Array<[string, GuildMember | undefined]>> {
    return Promise.all(
        nicks.map(async (name) => [name, await getUser(guild, name)])
    )
}

export function defineCommand<T extends CommandDefinition>(commandData: T): T {
    return commandData
}


export async function getAnnouncementChannel(
    id: string, guild: Guild
): Promise<AnnounceChannel | undefined> {
    const botMember = await guild.members.fetchMe()
    const botPermissions = botMember.permissions
    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) return undefined

    let channel
    try {
        channel = await guild.channels.fetch(id)
    } catch (e) {
        console.warn(`Failed to get announcement channel: ${e}`)
        return undefined
    }

    return channel?.isSendable()
        ? channel as unknown as AnnounceChannel
        : undefined
}

export async function canUseRole(guild: Guild, role: APIRole | Role): Promise<boolean> {
    const botMember = await guild.members.fetchMe()
    const botRole = botMember.roles.highest
    const botPermissions = botMember.permissions

    if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) return false
    if (botRole.position - role.position <= 0) return false
    if (role.managed) return false

    return true
}

export async function getRole(
    id: string, guild: Guild
): Promise<Role | undefined> {
    const role = await guild.roles.fetch(id)

    if (!role) return undefined
    if (!canUseRole(guild, role)) return undefined

    return role
}