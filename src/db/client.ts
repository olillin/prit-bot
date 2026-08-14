import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { databaseUrl } from '../environment'

const db = drizzle(databaseUrl as string)

console.log('Applying Drizzle migrations to database')
await migrate(db, { migrationsFolder: 'drizzle/' })

export default db
