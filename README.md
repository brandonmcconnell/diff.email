_This README is a working draft_

# diff.email

> End-to-end playground for email developers: author, preview, screenshot and **diff** HTML emails across real web-mail engines.

## Table of Contents
- Overview
- Features
- Tech Stack
- Monorepo Layout
- Prerequisites
- Quick Start
  - Clone & Install
  - Development Scripts
  - Environment Variables
- Database & Migrations
- Screenshot Pipeline
- Roadmap
- Contributing
- License

## Overview
`diff.email` lets you see what an email really looks like in Gmail, Outlook Web, Yahoo, iCloud and more across light *and* dark mode.   

The workflow is simple:

1. Write HTML (or React-Email) in the web editor.
2. Hit **Save & Run** to send yourself a test email and trigger a screenshot run.
3. Watch the grid fill up in real-time, then compare against previous versions.

Everything happens in one place so you can ship email updates with confidence.

## Features
### Product
- ✉️ Author & preview raw HTML or React-Email markup.
- 📸 One-click "Save & Run" kicks off 15 screenshots per run (3 engines × 5 clients).
- 🕶️ Dark-mode toggle.
- 🕑 Automatic version history with side-by-side diffs.
- ✅ Background worker keeps running even after you close the tab.
- 🔑 Email/password auth via **Better Auth**.

### Under the hood (boiler-plate goodies we kept)
- **TypeScript** everywhere
- **Next.js 14** App Router
- **TailwindCSS** + **shadcn/ui**
- **tRPC** for end-to-end types
- **Drizzle ORM** on **Neon Postgres**
- **BullMQ** + **Upstash Redis** queue
- **Playwright** (Chromium, Firefox, WebKit)
- **@vercel/blob** for public screenshot storage
- **Resend** for transactional email
- **Pino** logger, **Biome** formatter, **Husky** git hooks
- **pnpm** workspace

## Tech Stack (why we chose it)

| Layer         | Tech / Service            |
|---------------|---------------------------|
| Front-end     | Next.js 14 (App Router)   |
| Back-end API  | Next.js API routes + tRPC |
| Auth          | Better Auth (Postgres)    |
| DB            | Neon Postgres            |
| ORM           | Drizzle ORM              |
| Queue         | BullMQ + Upstash Redis    |
| Worker Host   | Vercel Background Fn      |
| Screenshots   | Playwright headless       |
| Object Store  | @vercel/blob              |

> Scope guard: we intentionally avoid Prisma, Bun, Mongo, Dynamo, etc.

## Monorepo Layout

```plaintext
diff-email/
├── apps/
│   ├── server/   # Next.js API + tRPC routes (port 3000)
│   ├── web/      # Next.js front-end (port 3001)
│   └── worker/   # Playwright screenshot worker
├── packages/
│   ├── logger/   # Shared Pino instance
│   └── shared/   # Re-used TypeScript types & utils
├── drizzle/      # SQL schema & migrations
└── ...
```

## Prerequisites
- Node 18+
- pnpm 8+
- A Postgres database (Neon free tier works great)
- An Upstash Redis database
- A Vercel Blob read/write token
- (Optional) Docker if you want to vendor Playwright browsers

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/brandonmcconnell/diff-email.git
cd diff-email
pnpm install
```

### 2. Environment variables

Copy `.env.example` and fill in the blanks:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/worker/.env.example apps/worker/.env
```

Core keys:

```
DATABASE_URL=
REDIS_URL=
BLOB_READ_WRITE_TOKEN=
RESEND_API_KEY=
```

### 3. Development scripts

```bash
# run everything (server + web + worker) concurrently
pnpm dev

# individual targets
pnpm dev:server     # http://localhost:3000
pnpm dev:web        # http://localhost:3001
pnpm dev:worker     # picks up screenshot jobs

# database
pnpm db:push        # push Drizzle schema
pnpm db:studio      # open Drizzle studio UI
```

## Database & Migrations

The schema lives in `drizzle/`.  
Use `pnpm db:push` to push changes and `pnpm db:generate` to regenerate
types.

## Screenshot Pipeline

1. `emails.sendTestAndRun` tRPC mutation sends a test email via Resend and enqueues a **run**.
2. The **worker** listens on BullMQ, launches Playwright with stored session cookies (`diff-email-sessions` folder on Vercel Blob).
3. Each job captures a PNG and uploads it back to Blob; a row is inserted into `screenshots`.
4. When the last job in the batch finishes the run status flips to `done` and the UI refreshes.

![pipeline](/docs/pipeline.svg)

## Roadmap

- Deep-link search inside webmail using `messageId` _(WIP)_  
- Retry/back-off strategy in worker  
- Diff overlay & accessibility lint hints  
- Team workspaces & RBAC  
- Prometheus metrics (post-MVP)

## Contributing

1. Fork → create a branch → PR  
2. Follow the ESLint/Biome rules (`pnpm check`)  
3. Make sure `pnpm test` is green (tests coming soon)
