import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const MAX_RETRIES = 30
const RETRY_INTERVAL_MS = 2000

const config = {
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? 'app',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME ?? 'app',
  multipleStatements: true,
}

async function waitForDB() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const conn = await mysql.createConnection(config)
      await conn.end()
      console.log('DB connection established')
      return
    } catch (err) {
      console.log(`Waiting for DB... attempt ${i}/${MAX_RETRIES}`)
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS))
    }
  }
  throw new Error(`Could not connect to DB after ${MAX_RETRIES} attempts`)
}

async function migrate() {
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.sql')
  const sql = readFileSync(schemaPath, 'utf8')

  const conn = await mysql.createConnection(config)
  try {
    await conn.query(sql)
    console.log('Migration completed successfully')
  } finally {
    await conn.end()
  }
}

try {
  await waitForDB()
  await migrate()
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
