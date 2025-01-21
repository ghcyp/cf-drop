<p align="center"><img src="./web/public/icon.svg" width="64"></p>
<h1 align="center">cf-drop</h1>
<p align="center">🗃️ Private File/Text Box — Deploy on Cloudflare Workers</p>


<table width="100%">
<tr>
<td>
<img src="./image.png" width="200">
</td>
<td>
<ul>
<li>⚡ <strong>Serverless</strong> on Cloudflare Worker</li>
<li>📱 <strong>PWA ready!</strong> for mobile</li>
<li>🔑 <strong>Password protected</strong></li>
<li>📦 <strong>Download</strong> as Tarball</li>
<li>🚚 <strong>Resumable download link</strong></li>
<li>🔗 <strong>Shareable download link</strong></li>
</ul>
</td>
</tr>
</table>

## 🚀 Quick Start

Follow these steps to get up and running quickly:

```sh
# Prerequisites: Node.js >= 20, pnpm

# Install dependencies
pnpm install

# Create R2 bucket
npx wrangler r2 bucket create cf-drop

# Create D1 database
npx wrangler d1 create cf-drop

# ... copy the database_id to wrangler.toml

# Deploy the application
npm run deploy

# For local development
# npm run dev
```

You can access the app on mobile and install it as a Progressive Web App (PWA).

## 🎨 Customize

Make `cf-drop` your own by customizing the following:

- 🔑 **Set password** via `./wrangler.toml`
- 🎨 **Change theme color** in `./web/public/manifest.json`
- 💡 **Find `database_id`** from Cloudflare Dashboard - D1 SQL page

---

Happy deploying! 🚀
