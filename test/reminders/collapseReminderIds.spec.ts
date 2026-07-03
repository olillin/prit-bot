import { expect, it } from 'vitest'
import { collapseReminderIds } from '../../src/features/reminders'
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
        {
            id: 11,
            message: 'E',
        },
    ],
    3: [],
    4: [
        {
            id: 5,
            message: 'F',
        },
    ],
}

it('produces a continuous sequence of integers starting at 1', () => {
    const result = collapseReminderIds(reminders)

    const expected: RemindersByDay = {
        1: [
            {
                id: 4,
                message: 'A',
            },
            {
                id: 2,
                message: 'B',
            },
        ],
        2: [
            {
                id: 5,
                message: 'C',
            },
            {
                id: 1,
                message: 'D',
            },
            {
                id: 6,
                message: 'E',
            },
        ],
        3: [],
        4: [
            {
                id: 3,
                message: 'F',
            },
        ],
    }

    expect(result).toStrictEqual(expected)
})
