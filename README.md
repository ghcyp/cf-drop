# cf-drop

A fast and simple tool to store and share temporary files via Cloudflare Workers.

```sh
pnpm install
npx wrangler r2 bucket create cf-drop
npx wrangler d1 create cf-drop

# copy the database_id to wrangler.toml
# -- or find it from Cloudflare Dashboard - D1 SQL page

npm run deploy
# npm run dev             # -- for local development
```
