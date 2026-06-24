import { drizzle } from 'drizzle-orm/node-postgres'

console.log('Connecting Drizzle...')
const db = drizzle(process.env.DATABASE_URL!)

export default db
