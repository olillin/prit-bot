import type { Guild, GuildMember } from 'discord.js'
import type { CommandDefinition } from '../types'

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
