import { expect, it } from 'vitest'
import { getOriginalReminder } from '../../src/features/reminders'
import type { RemindersByDay } from '../../src/types'

const reminders: RemindersByDay = {
    1: [
        {
            id: 6,
            message: 'A',
        },
        {
            id: 3,
            message: 'B',
        },
    ],
    2: [
        {
            id: 8,
            message: 'C',
        },
        {
            id: 0,
            message: 'D',
        },
    ],
    3: [],
    4: [
        {
            id: 5,
            message: 'E',
        },
    ],
}

it('returns the correct reminder', () => {
    const result = getOriginalReminder(3, reminders)
    expect(result).toStrictEqual({ id: 5, message: 'E' })
})

it('can return the first reminder', () => {
    const result = getOriginalReminder(1, reminders)
    expect(result).toStrictEqual({ id: 0, message: 'D' })
})

it('can return the last reminder', () => {
    const result = getOriginalReminder(5, reminders)
    expect(result).toStrictEqual({ id: 8, message: 'C' })
})

it('returns null if out of bounds', () => {
    const result = getOriginalReminder(6, reminders)
    expect(result).toBeNull()
})
