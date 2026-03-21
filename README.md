# CF Next

A modern, full-featured Cloudflare management dashboard built with Next.js 16 and the Cloudflare API.

## Features

- **Zones** — Browse, search, add and delete domains
- **DNS Records** — Full CRUD for all DNS record types (A, AAAA, CNAME, MX, TXT, SRV, CAA, etc.)
- **Firewall** — View firewall rules and IP access rules per zone
- **SSL/TLS** — Configure SSL mode, minimum TLS version, HSTS, Always HTTPS and more
- **Cache** — Manage cache level, browser TTL, development mode and purge zone cache
- **Settings** — Securely store and verify your Cloudflare API token

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Language | TypeScript |
| API | [Cloudflare API v4](https://developers.cloudflare.com/api) |

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd cf-next
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Configure your API token

1. Navigate to **Settings** in the sidebar (or click **Connect API Token** on first launch)
2. Paste your Cloudflare API token
3. Click **Verify Token** to confirm it works
4. Select your default account
5. Click **Save Settings**

> Your token is stored only in your browser's localStorage and is never sent anywhere except Cloudflare's API.

## Creating a Cloudflare API Token

1. Go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom Token** with the following permissions:

| Resource | Permission |
|----------|-----------|
| Zone | Read |
| Zone | Edit |
| DNS | Read |
| DNS | Edit |
| Firewall Services | Read |
| Firewall Services | Edit |
| Zone Settings | Read |
| Zone Settings | Edit |
| Cache Purge | Purge |

4. Under **Zone Resources**, set to **All zones** (or specific zones)
5. Click **Continue to summary** → **Create Token**

## Architecture

```
Browser
  │
  │  fetch('/api/cf/*', { headers: { 'x-cf-token': token } })
  ▼
Next.js API Routes  (app/api/cf/*)
  │
  │  fetch('https://api.cloudflare.com/client/v4/*', { 'Authorization': 'Bearer ...' })
  ▼
Cloudflare API v4
```

The client never calls Cloudflare directly. All requests are proxied through Next.js API routes, keeping the token off public network tabs.

### Key directories

```
cf-next/
├── app/
│   ├── (app)/               # Main app (dashboard, zones, settings)
│   │   ├── page.tsx          # Dashboard
│   │   ├── zones/            # Zone list + per-zone pages
│   │   │   └── [zoneId]/
│   │   │       ├── page.tsx  # Zone overview
│   │   │       ├── dns/      # DNS records
│   │   │       ├── firewall/ # Firewall rules
│   │   │       ├── ssl/      # SSL/TLS settings
│   │   │       └── cache/    # Cache settings
│   │   ├── settings/         # API token settings
│   │   └── activity/         # Activity log (coming soon)
│   └── api/cf/              # Cloudflare API proxy routes
├── components/
│   ├── ui/                  # Reusable UI (Button, Card, Table, Modal…)
│   ├── layout/              # Sidebar, PageHeader
│   ├── AppShell.tsx         # Auth gate + layout wrapper
│   └── ConfigProvider.tsx   # API token context
├── hooks/
│   └── useCFApi.ts          # CF API fetch helper
└── lib/
    ├── types.ts             # TypeScript types for CF API
    ├── cloudflare.ts        # Server-side CF API client
    └── utils.ts             # Formatters, config helpers
```

## Development

```bash
# Development server
npm run dev

# Type checking
npm run build

# Lint
npm run lint
```

## Security Notes

- API tokens are stored in `localStorage` — this is a local development tool, not a multi-user SaaS
- Tokens are never logged or sent to any third-party server
- The Next.js proxy layer prevents the raw token from appearing in browser DevTools network tabs on CF API calls
- `robots: { index: false }` is set in metadata — this app should not be indexed by search engines

## License

MIT
