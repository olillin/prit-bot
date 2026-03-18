import { Collection } from 'discord.js'
import { CommandDefinition } from '../util/command'
import { default as announce } from './announce'
import { default as config } from './config'
import { default as noreact } from './noreact'
import { default as reactions } from './reactions'
import { default as recheck } from './recheck'
import { default as reminders } from './reminders'
import { default as vecka } from './vecka'

const commands = new Collection<string, CommandDefinition>()

const definitions: CommandDefinition[] = [
	announce,
	config,
	noreact,
	reactions,
	recheck,
	reminders,
	vecka,
]
definitions.forEach(definition => {
	commands.set(definition.data.name, definition)
})

export default commands
