import { randomUUID } from "crypto"
import { Calendar, CalendarEvent } from "iamcal"
import { weekToDate, ONE_WEEK } from "../util/dates"

/**
 * Distribute members over a period of weeks
 * @param members A list of names identifiyng the members to distribute
 * @param previous The previous weeks from oldest to newest, used to add variety in pairs and avoid repeats
 * @param membersPerWeek How many members to put in each week
 * @returns An array of sets where each set is the members during a week. Each set is the size of `membersPerWeek`.
 */
export function distributeMembers(members: Set<string>, previous: Set<string>[] = [], membersPerWeek: number = 2): Set<string>[] {
    const weekCount = Math.ceil(members.size / membersPerWeek)
    /** How many members need two weeks to evenly distribute over */
    const neededRepititions = membersPerWeek - members.size % membersPerWeek

    // Analyze previous weeks
    const createStartingStatistics = (member: string): MemberWeekStatistics => ({
        repeatCount: 0,
        pairCount: new Map(Array.from(members).filter(v => v !== member).map(v => [v, 0])),
        mostRecentlyWith: new Set(),
    })
    const memberStats = new Map<string, MemberWeekStatistics>(
        Array.from(members).map(v => [v, createStartingStatistics(v)])
    )

    let previousWeekMembers: Set<string> = new Set()
    previous.forEach(weekMembers => {
        weekMembers.forEach(member => {
            const stats = memberStats.get(member)!
            // Update repeat count
            if (previousWeekMembers.has(member)) {
                stats.repeatCount++
            }

            const otherMembers = Array.from(weekMembers)
                .filter(other => other !== member)
            // Update most recently with
            stats.mostRecentlyWith = new Set(otherMembers)

            otherMembers
                .forEach(otherMember => {
                    // Update pair count
                    const pairCount = stats.pairCount.get(otherMember)!
                    stats.pairCount.set(otherMember, pairCount + 1)
                })
        })

        previousWeekMembers = weekMembers
    })

    console.log('Stats:')
    console.dir(memberStats.entries())

    // TODO: Distribute based on statistics
    return []
}

interface MemberWeekStatistics {
    /** How many times this member has had responsibility week two weeks in a row */
    repeatCount: number
    /** How many times this member has been paired with every other member */
    pairCount: Map<string, number>
    /** The last pair this member was with, not including themselves */
    mostRecentlyWith: Set<string>
}

/**
 * NOTES
 * 
 * Members: A, B, C, D
 * 
 * Example distribution with `membersPerWeek=2`:
 * 
 * Period 1 [previous= ]: AB, CD
 * Period 2a[previous=AB, CD]: AB, CD (Prioritize no repeats, varying pairs becomes impossible)
 * Period 2b[previous=AB, CD]: AD, BC ()
 * Period 3b[previous=AB, CD, AD, BC]: AC, BD (AC and BD have never been together so they are put together. D has repeated before )
 * 
 */

export function createSummary(members: Set<string>, prefix: string = 'Ansvar:'): string {
    const sortedMembers = Array.from(members).sort()
    return prefix.trim() + ' ' + sortedMembers.join(', ')
}

export function createEvents(weeks: Set<string>[], startWeek: number, prefix: string = 'Ansvar:'): CalendarEvent[] {
    let weekNumber = startWeek
    return weeks.map(weekMembers => {
        const summary = createSummary(weekMembers, prefix)
        const startTime = weekToDate(weekNumber)
        const endTime = new Date(startTime.getTime() + ONE_WEEK)

        weekNumber++

        const uid = randomUUID()
        const now = new Date()
        return new CalendarEvent(uid, now)
            .setSummary(summary)
            .setStart(startTime, true)
            .setEnd(endTime, true)
    })
}