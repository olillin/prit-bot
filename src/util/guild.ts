import {
    type APIRole,
    PermissionFlagsBits,
    type Role,
    type Guild,
    type GuildMember,
} from 'discord.js'
import type { AnnounceChannel } from '../types'
import type { CommandDefinition } from './command'
import { schedule } from './dates'
import { MaybePromise } from 'rollup'

/** Get a user in a guild from their nick */

export function getUser(guild: Guild, nick: string): GuildMember | undefined {
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
): Array<[string, GuildMember | undefined]> {
    return nicks.map(name => [name, getUser(guild, name)])
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

    const channel = await guild.channels.fetch(id).catch(reason => {
        console.warn(`Failed to get announcement channel: ${reason}`)
        return undefined
    })

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
    if (!(await canUseRole(guild, role))) return undefined

    return role
}

export class PerGuildLoop {
    private _currentGeneration: Map<number, number>

    getNextTime: (context: GuildLoopContext) => MaybePromise<Date>
    action: (context: GuildLoopContext) => MaybePromise<void>

    /**
     * @param getNextTime A function which returns the next time the loop should run.
     * @param action A function which performs some action once a day.
     */
    constructor(
        getNextTime: (context: GuildLoopContext) => MaybePromise<Date>,
        action: (context: GuildLoopContext) => MaybePromise<void>
    ) {
        this.getNextTime = getNextTime
        this.action = action

        this._currentGeneration = new Map()
    }

    /** Start a loop for this guild */
    start(guildId: number, guildSnowflake: string) {
        if (this._currentGeneration.has(guildId)) {
            this.stop(guildId)
        } else {
            this._currentGeneration.set(guildId, 0)
        }

        const context: GuildLoopContext = {
            guildId,
            guildSnowflake,
            generation: this.getGeneration(guildId),
        }

        void this.loop(context)
    }

    /** Stop the loop by increasing the generation. */
    stop(guildId: number) {
        if (!this._currentGeneration.has(guildId)) return
        const newGeneration = (this.getGeneration(guildId) + 1) % 1_000_000_000
        this._currentGeneration.set(guildId, newGeneration)
    }

    /** Restart the loop */
    reset(guildId: number, guildSnowflake: string) {
        this.stop(guildId)
        this.start(guildId, guildSnowflake)
    }

    getGeneration(guildId: number): number {
        return this._currentGeneration.get(guildId) ?? 0
    }

    private async loop(context: GuildLoopContext): Promise<void> {
        const nextTime = await this.getNextTime(context)
        schedule(nextTime, () => {
            // Kill loop if generation has increased
            if (context.generation < this.getGeneration(context.guildId)) return

            Promise.resolve(this.action(context))
                .catch(reason => {
                    console.error(
                        'Failed to perform guild loop action. Context:',
                        context,
                        '\nReason:',
                        reason
                    )
                })
                .then(() => this.loop(context))
                .catch(reason => {
                    console.error(
                        'Failed to continue guild loop. Context:',
                        context,
                        '\nReason:',
                        reason
                    )
                })
        })
    }
}

export interface GuildLoopContext {
    generation: number
    guildId: number
    guildSnowflake: string
}
