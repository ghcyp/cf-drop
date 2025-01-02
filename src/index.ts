import { Hono } from 'hono'

type Bindings = {
  ASSETS: { fetch: typeof fetch }
  DB: D1Database
  MY_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/test', (c) => {
  return c.text('Hello Hono')
})

export default app
