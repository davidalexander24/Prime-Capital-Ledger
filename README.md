# Prime Capital Ledger

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)

Professional portfolio management and financial analytics platform for global equity markets.

- **Live demo:** _coming soon_
- **Link Presentation:**: https://canva.link/ml3j7nmw1yauxx5
- **Link Deploy:** https://primecapitaledger.site/

![Dashboard](docs/screenshots/dashboard.png)

---

## About

A full-stack Next.js app that lets investors track holdings across brokerages, ingest transactions directly from PDF account statements, value their portfolio against live market data, and review performance, all from a single dashboard.

### Technical Highlights

- **`Decimal(19,4)` precision** for every monetary value, never `Float`, no rounding errors on financial math.
- **Immutable transaction ledger** with `daily_valuations` snapshots, full audit trail, append-only design.
- **Upstash Redis caching layer** for Yahoo Finance prices and USD↔IDR FX, stays under API rate limits, sub-100ms reads.
- **PDF parsing pipeline** for Ajaib and Stockbit broker statements, with deduplication on commit.
- **End-to-end type safety** from Prisma schema through Server Actions to React 19 components.

---

## Features

**Authentication**
- Google OAuth sign-in
- Email + password with bcrypt hashing
- NextAuth JWT sessions, protected dashboard routes

**Dashboard**
- Summary cards: total value, cost basis, unrealized P&L, period return
- Portfolio valuation chart over time (USD and IDR)
- Top-traded / movers widget
- Recent transactions table

**Portfolio**
- Aggregated holdings table: lots, average cost, last price, market value, P&L ($), P&L (%), portfolio weight
- Multi-currency display (USD / IDR) with live FX conversion

**Transactions**
- Immutable ledger covering `BUY`, `SELL`, `DEPOSIT`, `WITHDRAW`
- Manual entry dialog with ticker search and validation
- Source tagging for every record (manual vs. imported)

**Imports**
- PDF parsing for Ajaib and Stockbit brokerage statements
- CSV bulk import with preview before commit
- Import history view

**Analytics**
- Monthly returns chart
- Sector allocation breakdown
- Headline metrics: Sharpe ratio, max drawdown, win rate, average return

**Market data**
- Live prices via Yahoo Finance
- USD ↔ IDR exchange rates
- Upstash Redis caching to stay under API limits

**Settings**
- Profile (display name, email, base currency, timezone)
- Transaction stats and last-entry timestamp
- Logout

---

## Tech Stack

| Category | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Radix primitives, lucide-react |
| Forms | react-hook-form + Zod |
| Charts | Recharts 3 |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon serverless) |
| Auth | NextAuth 4 (Google + Credentials), bcryptjs |
| Cache | Upstash Redis |
| Market data | yahoo-finance2 |
| PDF parsing | pdf-parse, pdf2json |
| Dates | date-fns |

---

## Screenshots

| | |
|---|---|
| ![Portfolio](docs/screenshots/portfolio.png)<br/>**Portfolio** - aggregated holdings with live P&L | ![Transactions](docs/screenshots/transactions.png)<br/>**Transactions** - immutable buy/sell/deposit/withdraw ledger |
| ![Import](docs/screenshots/import.png)<br/>**Import** - PDF parsing for broker statements | ![Analytics](docs/screenshots/analytics.png)<br/>**Analytics** - returns, allocation, risk metrics |

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| PostgreSQL | ≥ 15 (or a Neon project) |
| Git | ≥ 2 |

### 1. Clone and install

```bash
git clone https://github.com/davidalexander24/Prime-Capital-Ledger.git
cd Prime-Capital-Ledger
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment

Create a `.env` at the repo root:

```env
# Database (Neon or local Postgres)
DATABASE_URL="postgresql://user:password@host:5432/prime_capital_ledger?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/prime_capital_ledger?schema=public"

# NextAuth
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth - create a Web client at https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Upstash Redis (market data cache)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Scheduled jobs
CRON_SECRET="local-development-secret"

# Optional: seed a dev user when running `npm run db:seed`
DEV_SEED_EMAIL="admin@example.com"
DEV_SEED_PASSWORD="admin123"
DEV_SEED_NAME="Admin"
```

### 3. Set up the database

```bash
npx prisma migrate dev
npm run db:seed         # optional, creates the DEV_SEED_* user and demo data
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (hot reload) |
| `npm run dev:seed` | Seed the database, then start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production server |
| `npm run db:seed` | Seed development data (`prisma/seed.ts`) |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
prime-capital-ledger/
├── prisma/
│   ├── schema.prisma                # Models, enums, relations
│   ├── seed.ts                      # Dev seed script
│   └── migrations/                  # Prisma migrations
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Login & register pages
│   │   ├── api/auth/                # NextAuth + register endpoint
│   │   ├── dashboard/               # Protected app
│   │   │   ├── page.tsx             # Overview
│   │   │   ├── portfolio/           # Holdings
│   │   │   ├── transactions/        # Ledger
│   │   │   ├── import/              # PDF / CSV import
│   │   │   ├── analytics/           # Performance metrics
│   │   │   └── settings/            # Account settings
│   │   ├── actions/                 # Server Actions (data fetching & mutations)
│   │   ├── globals.css              # Dark theme + design tokens
│   │   ├── layout.tsx               # Root layout
│   │   └── providers.tsx            # Session provider
│   ├── components/
│   │   ├── auth/                    # Google sign-in button, etc.
│   │   ├── charts/                  # Recharts wrappers
│   │   ├── dashboard/               # Feature components (cards, dialogs, tables)
│   │   ├── layout/                  # Sidebar, header, footer
│   │   └── ui/                      # shadcn/ui primitives, do not edit manually
│   ├── lib/
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── redis.ts                 # Upstash client
│   │   ├── marketData.ts            # Yahoo Finance + FX, with Redis caching
│   │   ├── types.ts                 # Shared TypeScript types
│   │   └── utils.ts                 # `cn`, formatters
│   └── assets/                      # Static images (logo)
├── public/                          # Public static assets
├── components.json                  # shadcn/ui config
├── next.config.ts
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

---

## Database

```
┌──────┐       ┌─────────────┐       ┌───────┐
│ User │──1:N──│ Transaction │──N:1──│ Asset │
│      │       └─────────────┘       └───────┘
│      │──1:N──│DailyValuation│
│      │──1:N──│   Account    │      (NextAuth)
│      │──1:N──│   Session    │      (NextAuth)
└──────┘
```

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Identity, profile, preferences |
| `Account` | `accounts` | NextAuth OAuth provider links |
| `Session` | `sessions` | NextAuth sessions |
| `VerificationToken` | `verification_tokens` | NextAuth email verification |
| `Asset` | `assets` | Master security data (ticker, company, currency) |
| `Transaction` | `transactions` | Immutable buy/sell/deposit/withdraw ledger |
| `DailyValuation` | `daily_valuations` | End-of-day portfolio snapshots (USD + IDR) |

**Enum** - `TransactionType`: `BUY`, `SELL`, `DEPOSIT`, `WITHDRAW`.

**Precision** - prices use `Decimal(19, 4)`, quantities `Decimal(19, 9)`, IDR totals `Decimal(19, 2)`. Dates are stored as `@db.Date`.

### Prisma quick reference

```bash
npx prisma studio                        # Visual DB browser
npx prisma migrate dev --name <name>     # Create + apply a migration
npx prisma migrate reset                 # Reset DB (destructive)
npx prisma generate                      # Regenerate client
npx prisma validate                      # Validate schema
```

---

## Development Notes

**Branching.** `feat/*` → `dev` → `main`. Open a PR into `dev`; `dev` → `main` happens at release milestones.

**Conventions.**
- TypeScript strict mode; avoid `any`.
- Server Components by default. Add `"use client"` only when you need browser APIs, hooks, or event handlers.
- Absolute imports via the `@/` alias.
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes; reference semantic design tokens from `globals.css` rather than hardcoding colors.
- All monetary values use Prisma `Decimal`, never `Float`. Always pair a value with its currency. Use `date-fns` for date math.

**Adding a UI component.** This project uses [shadcn/ui](https://ui.shadcn.com/) - components are copied into the codebase, not imported from a package.

```bash
npx shadcn add <component-name>
```

Don't edit files in `src/components/ui/` manually. If you need to customize, wrap the primitive in a component under `src/components/`.

### Troubleshooting

- **`prisma generate` fails** - verify `DATABASE_URL` and that the database exists. For a fresh local Postgres: `createdb prime_capital_ledger && npx prisma migrate dev`.
- **Port 3000 in use** - `npx kill-port 3000` then `npm run dev`.
- **Tailwind classes not applying** - this project uses Tailwind CSS v4 with PostCSS. Ensure `postcss.config.mjs` is present and `@tailwindcss/postcss` is in `devDependencies`.

---

## License

Private - All rights reserved.
