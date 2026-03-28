import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { db } from './client'

async function migrate() {
  const sql = readFileSync(
    join(__dirname, 'migrations/001_init.sql'),
    'utf-8'
  )
  const client = await db.connect()
  try {
    await client.query(sql)
    console.log('[Migrate] 완료')
  } finally {
    client.release()
    await db.end()
  }
}

migrate().catch((err) => {
  console.error('[Migrate] 실패:', err)
  process.exit(1)
})
