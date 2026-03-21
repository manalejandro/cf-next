# CF Next

A modern, full-featured Cloudflare management dashboard built with Next.js and the Cloudflare API v4.

## Features

- **Zones** — Browse, search, add and delete domains
- **DNS Records** — Full CRUD for all DNS record types (A, AAAA, CNAME, MX, TXT, SRV, CAA, etc.) with inline proxy toggle
- **Firewall** — View firewall rules and IP access rules per zone
- **SSL/TLS** — Configure SSL mode, minimum TLS version, HSTS, Always HTTPS and more
- **Cache** — Manage cache level, browser TTL, development mode and purge zone cache
- **Activity** — Audit log viewer (account events) and zone traffic analytics dashboard
- **Settings** — Securely store and verify your Cloudflare API token
- **Light/Dark mode** — Full theme support with correct styling in both modes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Language | TypeScript |
| Runtime | [Cloudflare Workers](https://workers.cloudflare.com) via [OpenNext](https://opennext.js.org) |
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

> Your token is stored only in your browser's `localStorage` and is never sent anywhere except Cloudflare's API through the local proxy.

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
| Account Settings | Read *(for Audit Logs)* |
| Zone Analytics | Read *(for Analytics tab)* |

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

The client never calls Cloudflare directly. All requests are proxied through Next.js API routes, keeping the token out of public network tabs.

### Key directories

```
cf-next/
├── app/
│   ├── (app)/               # Main app (dashboard, zones, settings)
│   │   ├── page.tsx          # Dashboard
│   │   ├── zones/            # Zone list + per-zone pages
│   │   │   └── [zoneId]/
│   │   │       ├── page.tsx  # Zone overview
│   │   │       ├── dns/      # DNS records (with inline proxy toggle)
│   │   │       ├── firewall/ # Firewall rules + IP access rules
│   │   │       ├── ssl/      # SSL/TLS settings
│   │   │       └── cache/    # Cache settings + purge
│   │   ├── settings/         # API token configuration
│   │   └── activity/         # Audit log + zone analytics dashboard
│   └── api/cf/               # Cloudflare API proxy routes
│       ├── accounts/
│       │   └── [accountId]/audit_logs/  # Account audit events
│       └── zones/[zoneId]/
│           ├── dns/          # DNS records CRUD
│           ├── firewall/     # Firewall rules + access rules
│           ├── purge/        # Cache purge
│           ├── settings/     # Zone settings
│           └── analytics/    # Zone traffic analytics
├── components/
│   ├── ui/                  # Reusable UI (Button, Card, Table, Modal, Badge…)
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

## Activity Page

The **Activity** page has two tabs:

### Audit Log
Shows account-level audit events (DNS changes, setting modifications, logins, etc.) sourced from the Cloudflare Audit Log API (`/accounts/{id}/audit_logs`). Supports filtering by action type and pagination. Available on all plan types.

### Analytics
Displays zone traffic analytics for the selected zone and time window (1h / 24h / 7d / 30d):
- Total requests, bandwidth, threats blocked, unique visitors
- Cache hit rate progress bar
- HTTP status code breakdown with visual bars
- Top countries and content types

> **Note:** Zone Analytics requires a **Pro** plan or higher. Free plan zones will return an error on this tab.

## DNS Proxy Toggle

In the DNS Records table, proxiable record types (A, AAAA, CNAME) show an inline toggle switch in the **Proxy** column. Click it to enable or disable Cloudflare proxy for that record without opening the edit dialog.

## Development

```bash
# Development server
npm run dev

# Type checking
npm run build

# Lint
npm run lint
```

## Deploying to Cloudflare Workers

This project uses [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) to deploy as a Cloudflare Worker.

```bash
# Preview locally with Wrangler
npm run preview

# Deploy to Cloudflare Workers
npm run deploy
```

Configuration is in `wrangler.jsonc` and `open-next.config.ts`.

## Security Notes

- API tokens are stored in `localStorage` — this is a local/personal tool, not a multi-user SaaS
- Tokens are never logged or sent to any third-party server
- The Next.js proxy layer prevents the raw token from appearing in browser DevTools network tabs on CF API calls
- `robots: { index: false }` is set in metadata — this app should not be indexed by search engines

## License

MIT


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
