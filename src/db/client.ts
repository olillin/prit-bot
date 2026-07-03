import { drizzle } from 'drizzle-orm/node-postgres'
import { databaseUrl } from '../environment'

const db = drizzle(databaseUrl as string)

export default db
