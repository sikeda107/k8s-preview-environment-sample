import mysql from 'mysql2/promise'

// Next.js dev のホットリロードでプールが増殖しないよう globalThis にキャッシュする
const globalForDb = globalThis as typeof globalThis & { dbPool?: mysql.Pool }

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? 'app',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME ?? 'app',
    waitForConnections: true,
    connectionLimit: 10,
  })
}

export const pool: mysql.Pool = globalForDb.dbPool ?? createPool()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.dbPool = pool
}
