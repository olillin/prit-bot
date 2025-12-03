import {
    type APIRole,
    PermissionFlagsBits,
    type Role,
    type Guild,
    type GuildMember,
    Client,
} from 'discord.js'
import type { AnnounceChannel } from '../types'
import type { CommandDefinition } from './command'
import { schedule } from './dates'

/** Get a user in a guild from their nick */

export async function getUser(
    guild: Guild,
    nick: string
): Promise<GuildMember | undefined> {
    const members = guild.members.cache
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
        nicks.map(async name => [name, await getUser(guild, name)])
    )
}

export function defineCommand<T extends CommandDefinition>(commandData: T): T {
    return commandData
}

export async function getAnnouncementChannel(
    id: string,
    guild: Guild
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
        ? (channel as unknown as AnnounceChannel)
        : undefined
}

export async function canUseRole(
    guild: Guild,
    role: APIRole | Role
): Promise<boolean> {
    const botMember = await guild.members.fetchMe()
    const botRole = botMember.roles.highest
    const botPermissions = botMember.permissions

    if (!botPermissions.has(PermissionFlagsBits.ManageRoles)) return false
    if (botRole.position - role.position <= 0) return false
    if (role.managed) return false

    return true
}

export async function getRole(
    id: string,
    guild: Guild
): Promise<Role | undefined> {
    const role = await guild.roles.fetch(id)

    if (!role) return undefined
    if (!canUseRole(guild, role)) return undefined

    return role
}

export class PerGuildLoop {
    private _currentGeneration: Map<string, number>

    getNextTime: (context: GuildLoopContext) => Date
    action: (context: GuildLoopContext) => void

    /**
     * @param getNextTime A function which returns the next time the loop should run.
     * @param action A function which performs some action once a day.
     */
    constructor(
        getNextTime: (context: GuildLoopContext) => Date,
        action: (context: GuildLoopContext) => void
    ) {
        this.getNextTime = getNextTime
        this.action = action

        this._currentGeneration = new Map()
    }

    /** Start a loop for this guild */
    start(guildId: string) {
        if (this._currentGeneration.has(guildId)) {
            this.stop(guildId)
        } else {
            this._currentGeneration.set(guildId, 0)
        }

        const context: GuildLoopContext = {
            guildId,
            generation: this.getGeneration(guildId),
        }

        this.loop(context)
    }

    /** Stop the loop by increasing the generation. */
    stop(guildId: string) {
        if (!this._currentGeneration.has(guildId)) return
        const newGeneration = (this.getGeneration(guildId) + 1) % 1_000_000_000
        this._currentGeneration.set(guildId, newGeneration)
    }

    /** Restart the loop */
    reset(guildId: string) {
        this.stop(guildId)
        this.start(guildId)
    }

    getGeneration(guildId: string): number {
        return this._currentGeneration.get(guildId) ?? 0
    }

    private loop(context: GuildLoopContext): Promise<void> {
        const nextTime = this.getNextTime(context)
        return schedule(nextTime, () => {
            // Kill loop if generation has increased
            if (context.generation < this.getGeneration(context.guildId)) return

            this.action(context)

            this.loop(context)
        })
    }
}

interface GuildLoopContext {
    generation: number
    guildId: string
}
