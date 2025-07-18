/** Scrape the current members of P.R.I.T. from chalmers.it */
export async function getCurrentMembers(url: string = 'https://chalmers.it/groups/prit'): Promise<string[]> {
    return fetch(url)
        .then(res => res.text())
        .then(text => {
            const section = text.split('Nuvarande medlemmar')[1]
            const pattern = /(?<=<h3>).+?(?=<\/h3>)/g
            const matches = section.matchAll(pattern)
            const members = Array.from(matches).map(match => match[0])
            return members
        })
}
