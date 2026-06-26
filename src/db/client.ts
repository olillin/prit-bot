import { drizzle } from 'drizzle-orm/node-postgres'
import { databaseUrl } from '../environment'

if (!databaseUrl) {
    throw new Error('Failed to connect Drizzle, no database URL')
}
console.log('Connecting Drizzle...')
const db = drizzle(databaseUrl)

export default db
