import { Hono } from 'hono'
import { createUploadRecord, getUploadRecords, migrateTables } from './database'

type Bindings = {
  ASSETS: { fetch: typeof fetch }
  DB: D1Database
  MY_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/test', async (c) => {
  await migrateTables(c.env.DB)

  const list = await getUploadRecords(c.env.DB)
  return c.json(list)

  // const r = await createUploadRecord(c.env.DB, {
  //   uploader: 'yon',
  //   size: 0,
  //   thumbnail: null,
  //   files: '',
  //   message: '',
  // })
  // return c.json(r)
})

export default app
