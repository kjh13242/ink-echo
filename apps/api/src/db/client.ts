import { Pool, type PoolClient } from 'pg'

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 헬퍼: 트랜잭션
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// 헬퍼: 단일 쿼리
export async function query<T = Record<string, unknown>>(
  text: string,
  values?: unknown[]
) {
  const start = Date.now()
  const result = await db.query<T>(text, values)
  const duration = Date.now() - start

  if (process.env.NODE_ENV === 'development' && duration > 100) {
    console.log(`[DB] 느린 쿼리 (${duration}ms):`, text)
  }

  return result
}
