import type { Calendar } from "iamcal/lib"

/**
 * Interact with the web-service TimeSend, which allows you to add calendar events through a URL
 * @see https://timesend.olillin.com
 */

/**
 * Upload a calendar to TimeSend and get the URL.
 * 
 * @returns the URL returned from TimeSend.
 */
export async function createUrl(calendar: Calendar, timeSendUrl: string = 'https://timesend.olillin.com'): Promise<string> {
    const uploadPath = '/api/upload'
    const requestUrl = timeSendUrl + uploadPath

    const body = calendar.serialize()

    const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/calendar'
        },
        body,
    })

    if (!response.ok) {
        throw new Error(`Something went wrong when trying to POST to ${requestUrl}`)
    }

    const responseBody = await response.json()
    const returnedUrl = responseBody.url

    return returnedUrl
}