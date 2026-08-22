import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { databaseUrl } from '../environment'
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: databaseUrl as string,
})
const db = drizzle(pool)

if (process.env.NODE_ENV !== 'test') {
    console.log('Applying Drizzle migrations to database')
    await migrate(db, { migrationsFolder: 'drizzle/' })
}

/**
 * End the database connection.
 */
export async function endDatabaseConnection() {
    return pool.end()
}

export default db
