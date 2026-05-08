# Prime Capital Ledger

Professional portfolio management and financial analytics platform for Indonesian equity markets.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Database](#database)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Adding UI Components](#adding-ui-components)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

| Tool | Version | Check |
|---|---|---|
| **Node.js** | ≥ 20.x | `node -v` |
| **npm** | ≥ 10.x | `npm -v` |
| **PostgreSQL** | ≥ 15.x | `psql --version` |
| **Git** | ≥ 2.x | `git --version` |

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/davidalexander24/Prime-Capital-Ledger.git
   cd Prime-Capital-Ledger
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your values:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/prime_capital_ledger?schema=public"
   NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   # Create and apply all migrations
   npx prisma migrate dev

   # Generate the Prisma client
   npx prisma generate
   ```

5. **Verify everything works**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you should see the app running in dark mode with the Slate theme.

---

## Running the Project

| Command | Description |
|---|---|
| `npm run dev` | Start development server (hot-reload) |
| `npm run build` | Create production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint across the codebase |

---

## Project Structure

```
prime-capital-ledger/
├── prisma/
│   └── schema.prisma             # Database models (User, Asset, Transaction, DailyValuation)
├── prisma.config.ts
├── src/
│   ├── app/                      # Next.js App Router (pages & API routes)
│   │   ├── globals.css           # Slate dark theme + design tokens
│   │   ├── layout.tsx            # Root layout (dark mode, fonts, metadata)
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── charts/               # Recharts-based data visualizations
│   │   ├── layout/               # Shell components (Sidebar, Header, Footer)
│   │   └── ui/                   # shadcn/ui primitives (do NOT edit directly)
│   ├── hooks/                    # Custom React hooks
│   └── lib/
│       ├── database/             # Prisma client singleton & query helpers
│       ├── parsers/              # PDF ingestion logic (Ajaib, Stockbit)
│       ├── valuation/            # Portfolio math & P&L calculations
│       └── utils.ts              # Shared utilities (cn, formatters)
├── public/                       # Static assets
├── .env.example                  # Environment variable template
├── components.json               # shadcn/ui configuration
├── package.json
└── tsconfig.json
```

### Key Directories

| Directory | Purpose | Owner |
|---|---|---|
| `src/app/` | Pages & API routes — file-based routing | Full-stack |
| `src/components/ui/` | shadcn primitives — **do not edit manually** (use `npx shadcn add`) | Design system |
| `src/components/charts/` | Recharts wrappers for portfolio charts | Frontend |
| `src/components/layout/` | App shell — sidebar, header, navigation | Frontend |
| `src/hooks/` | Reusable React hooks | Frontend |
| `src/lib/database/` | Prisma client, query abstractions | Backend |
| `src/lib/parsers/` | Brokerage PDF → structured data | Backend |
| `src/lib/valuation/` | NAV, P&L, drawdown calculations | Backend |
| `prisma/` | Schema & migrations | Backend |

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Language** | TypeScript 5 | Type safety across the stack |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **UI Components** | shadcn/ui (Radix Nova preset) | Accessible, composable primitives |
| **Icons** | lucide-react | Consistent icon library |
| **ORM** | Prisma | Type-safe database access |
| **Database** | PostgreSQL | Relational data store |
| **Charts** | Recharts | Portfolio & performance visualizations |
| **Market Data** | yahoo-finance2 | Real-time & historical stock prices |
| **PDF Parsing** | pdf-parse | Brokerage statement ingestion |
| **Date Handling** | date-fns | Financial date manipulation |
| **Forms** | react-hook-form + zod | Validated form management |

---

## Database

### Schema Overview

```
┌──────────┐       ┌──────────────┐       ┌─────────┐
│   User   │──1:N──│ Transaction  │──N:1──│  Asset   │
│          │       │              │       │          │
│          │──1:N──│DailyValuation│       │          │
└──────────┘       └──────────────┘       └──────────┘
```

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Identity & authentication, preferences |
| `Asset` | `assets` | Master security data (ticker, exchange, sector) |
| `Transaction` | `transactions` | Immutable buy/sell ledger with full fee breakdown |
| `DailyValuation` | `daily_valuations` | End-of-day portfolio snapshots with risk metrics |

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `USER`, `ADMIN` |
| `AssetType` | `STOCK`, `ETF`, `BOND`, `MUTUAL_FUND`, `CRYPTO` |
| `TransactionType` | `BUY`, `SELL` |
| `TransactionSource` | `MANUAL`, `AJAIB_PDF`, `STOCKBIT_PDF`, `CSV_IMPORT`, `API_SYNC` |

### Common Prisma Commands

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# Generate/regenerate the Prisma client
npx prisma generate

# Pull schema from existing database
npx prisma db pull
```

---

## Development Workflow

### Branch Strategy

```
main              ← production-ready, protected
 └── dev          ← integration branch
      └── feat/*  ← feature branches
      └── fix/*   ← bug fix branches
      └── chore/* ← maintenance / config
```

**Rules:**

1. **Never push directly to `main`** — always open a Pull Request.
2. Create feature branches from `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/portfolio-dashboard
   ```
3. Keep commits atomic and descriptive:
   ```
   feat(charts): add equity curve line chart component
   fix(parser): handle Ajaib PDF multi-page statements
   chore(deps): bump prisma to 6.20
   ```
4. Open a PR into `dev` when ready. Request at least **1 review**.
5. `dev` → `main` merges happen at release milestones.

### Pull Request Checklist

Before requesting a review, ensure:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] `npx prisma validate` passes (if schema was changed)
- [ ] New database changes include a migration (`npx prisma migrate dev --name <name>`)
- [ ] No `.env` or secrets committed (check with `git diff --cached`)
- [ ] TypeScript compiles with `npx tsc --noEmit`

---

## Code Conventions

### General Rules

- **TypeScript strict mode** — no `any` types without justification.
- **Functional components** — no class components.
- **Server Components by default** — only add `"use client"` when you need browser APIs, hooks, or event handlers.
- **Absolute imports** — always use `@/` path aliases:
  ```typescript
  // ✅ Good
  import { Button } from "@/components/ui/button";
  import { cn } from "@/lib/utils";

  // ❌ Bad
  import { Button } from "../../../components/ui/button";
  ```

### File Naming

| Type | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `EquityCurve.tsx` |
| Hooks | `camelCase.ts` with `use` prefix | `usePortfolio.ts` |
| Utilities / Libs | `camelCase.ts` | `calculatePnL.ts` |
| API Routes | `route.ts` in folder | `app/api/transactions/route.ts` |
| Types / Interfaces | `PascalCase` exports | `export interface PortfolioSummary` |

### Styling Rules

- Use **Tailwind CSS** utility classes — no raw CSS unless unavoidable.
- Use the **`cn()` helper** for conditional classes:
  ```tsx
  import { cn } from "@/lib/utils";

  <div className={cn("rounded-lg p-4", isActive && "bg-primary")} />
  ```
- Reference **design tokens** from `globals.css` — don't hardcode colors:
  ```tsx
  // ✅ Use semantic tokens
  className="text-muted-foreground bg-card"

  // ❌ Don't hardcode
  className="text-gray-400 bg-slate-800"
  ```

### Financial Data Rules

- **Always use `Decimal`** for monetary values in Prisma — never `Float`.
- All prices use **`Decimal(18, 4)`** precision.
- Percentage fields use **`Decimal(10, 6)`** for precision to 4 decimal places of percentage.
- Default currency is **IDR** — always store and pass `currency` alongside values.
- Use **`date-fns`** for all date operations — no raw `Date` manipulation.

---

## Adding UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) — components are copied into your codebase, not imported from a package.

```bash
# Add a new component
npx shadcn add <component-name>

# Examples
npx shadcn add dropdown-menu
npx shadcn add toast
npx shadcn add tabs
```

> **⚠️ Do not manually edit files in `src/components/ui/`.** These are managed by shadcn. If you need to customize a component, create a wrapper in `src/components/` instead.

### Currently Installed Components

`button` · `card` · `dialog` · `form` · `input` · `label` · `table`

---

## Common Commands

```bash
# ─── Development ──────────────────────────
npm run dev                              # Start dev server
npm run build                            # Production build
npm run lint                             # Lint check

# ─── Database ─────────────────────────────
npx prisma studio                        # Visual DB browser
npx prisma migrate dev --name <name>     # Create migration
npx prisma generate                      # Regenerate client
npx prisma validate                      # Validate schema

# ─── Type Checking ────────────────────────
npx tsc --noEmit                         # Full type check

# ─── UI Components ────────────────────────
npx shadcn add <component>              # Add shadcn component
```

---

## Troubleshooting

### `prisma generate` fails

Make sure your `DATABASE_URL` in `.env` is valid. If you haven't created the database yet:

```bash
createdb prime_capital_ledger
npx prisma migrate dev
```

### Port 3000 already in use

```bash
# Find and kill the process
npx kill-port 3000
npm run dev
```

### shadcn component not found

Ensure `components.json` exists at the project root and the aliases are correct:

```json
{
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Tailwind classes not applying

This project uses **Tailwind CSS v4** with PostCSS. Ensure `postcss.config.mjs` is present and `@tailwindcss/postcss` is in dev dependencies.

---

## License

Private — All rights reserved.
