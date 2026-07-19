# SmartCRM

**An AI-powered CRM for small businesses** — customers, pipeline, tasks, meetings and sales in one place, with six AI tools built directly into the workflow instead of bolted on the side.

Live demo: log in and click **"Try the demo — no sign-up needed"** to explore a fully seeded workspace.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Languages & technologies](#languages--technologies)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Demo account](#demo-account)
- [AI tools & mock mode](#ai-tools--mock-mode)
- [Roles & permissions](#roles--permissions)
- [Available scripts](#available-scripts)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

---

## Overview

SmartCRM is a multi-tenant SaaS CRM built as a single Next.js application. Every business record (customers, leads, deals, tasks, meetings, invoices) belongs to an **Organization**, and users can hold different **Roles** (Owner, Manager, Sales Representative, Support) within that organization — the same account structure a real B2B CRM needs from day one.

It's built with a production-style stack (Postgres + Prisma, Auth.js, Server Actions, OpenAI) but every external integration — email, file storage, and AI — gracefully degrades to a working **mock mode** when no API key is configured, so the entire app is fully functional and testable without signing up for anything.

## Features

### Core CRM
- **Authentication** — email/password (bcrypt-hashed) and Google OAuth, JWT sessions, protected routes, forgot/reset password
- **Multi-tenancy** — organizations with role-based membership; invite teammates by email with an accept/decline flow
- **Dashboard** — live stat cards (customers, leads, sales, revenue, tasks due today, meetings), a pipeline overview, and four charts (monthly revenue, lead conversion funnel, sales trend, customer growth)
- **Customers** — full CRUD, search, status filter, pagination, and a profile page with an auto-logged activity timeline, notes, and document uploads
- **Leads** — drag-and-drop Kanban board across seven pipeline stages (New → Contacted → Qualified → Proposal → Negotiation → Won/Lost), with deal value, probability, source, and assignee
- **Tasks** — priorities, due dates, recurrence (daily/weekly/monthly with auto-generated next occurrence on completion), list and calendar views
- **Meetings** — scheduling with internal (team) and external (email) attendees, location/agenda, upcoming/past grouping
- **Sales** — products, deals, invoices with dynamic line items and tax, and payment recording that automatically flips invoice status
- **Admin panel** — team management, role changes, member removal, a role/permission reference table, plan selection, and a salesperson leaderboard
- **Audit trail** — every AI call and every admin action (role changes, removals, plan changes) is logged to the database

### AI tools
Six AI features, each backed by OpenAI (with a heuristic mock fallback computed from real data when no API key is set):
1. **Lead Scoring** — 0–100 score with a plain-English reason, saved back onto the lead
2. **Email Generator** — cold, follow-up, thank-you and proposal drafts, fully editable, with a working send button
3. **Meeting Summary** — paste a transcript, get a summary, action items, risks, and next steps
4. **Sales Insights** — top opportunities, weak pipeline areas, recommendations, and a revenue forecast computed from real pipeline/payment data
5. **Customer Sentiment** — classifies a customer's notes as positive/neutral/negative with cited reasoning
6. **Task Suggestions** — recommends next actions (call, follow up, schedule, send proposal) based on a customer's actual activity, with a one-click "add as task" button

## Languages & technologies

| Layer | Technology |
|---|---|
| **Language** | TypeScript (strict mode) — application logic, both client and server |
| **Language** | CSS — Tailwind CSS v4 utility classes plus a small hand-written stylesheet (theme tokens, scrollbar, animations) |
| **Language** | Prisma Schema Language (`.prisma`) — the database schema/DSL that generates the typed Prisma Client |
| **Language** | SQL — PostgreSQL, spoken to exclusively through Prisma's generated client (no hand-written SQL) |
| **Language** | Markdown — this file and other docs |
| **Framework** | Next.js 15 (App Router, Server Components, Server Actions, Route Handlers) |
| **UI library** | React 19 |
| **Styling** | Tailwind CSS v4 + a small custom component kit in the shadcn/ui style (Radix UI primitives + `class-variance-authority`) |
| **Forms & validation** | React Hook Form + Zod |
| **Data fetching (client)** | TanStack Query |
| **Charts** | Recharts |
| **Drag and drop** | dnd-kit |
| **Database** | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| **ORM** | Prisma |
| **Auth** | Auth.js (NextAuth) v5 — Credentials + Google OAuth |
| **AI** | OpenAI SDK (GPT-4o mini) |
| **Email** | Resend |
| **File storage** | UploadThing |
| **Testing** | Vitest, Testing Library |
| **Tooling** | ESLint, tsx (TypeScript script runner), Turbopack |

## Architecture

The codebase follows a **feature-based structure**: each business domain owns its schemas, server actions, and components, rather than splitting everything by technical layer.

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/                # login, register, forgot/reset password
│   ├── (dashboard)/            # every authenticated page, wrapped in the sidebar/topbar shell
│   │   ├── dashboard/          # stat cards + charts
│   │   ├── customers/[id]/     # list + profile page
│   │   ├── leads/              # Kanban board
│   │   ├── tasks/              # list + calendar views
│   │   ├── meetings/
│   │   ├── sales/              # products / invoices / deals tabs
│   │   ├── ai/                 # the six AI tool panels
│   │   └── admin/              # team / permissions / plan / analytics tabs
│   ├── api/                   # NextAuth route handler, UploadThing route
│   └── invite/[token]/        # public invitation-acceptance page
├── features/                  # one folder per domain
│   └── <domain>/
│       ├── schemas/            # Zod validation
│       ├── actions/             # Server Actions + data-fetching
│       └── components/          # feature-specific UI
├── components/
│   ├── ui/                     # shadcn-style primitives (button, card, table, dialog, sheet, …)
│   ├── layout/                  # sidebar, topbar, mobile nav, theme toggle
│   └── shared/                  # cross-feature components (pagination, delete button, tag input)
├── lib/                        # db client, auth config, RBAC, AI client, email client, formatters
└── config/                     # navigation config

prisma/
├── schema.prisma               # full relational schema
└── seed.ts                     # demo organization + sample data
```

**Server Actions** are used for almost every mutation (create/update/delete across every feature) instead of hand-rolled API routes — Route Handlers are reserved for the two things that need them: the NextAuth callback and UploadThing's upload endpoint.

## Database schema

Every table is scoped by `organizationId` — there is no cross-tenant read. The schema (`prisma/schema.prisma`) models:

- **Auth**: `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`
- **Multi-tenancy**: `Organization`, `Membership` (carries the `Role`), `Invitation`
- **CRM core**: `Customer`, `Lead`, `Deal`, `Task`, `Meeting`, `MeetingAttendee`, `Note`, `Document`, `Activity`
- **Sales**: `Product`, `DealProduct`, `Invoice`, `InvoiceItem`, `Payment`
- **Governance**: `AILog` (every AI call), `AuditLog` (admin actions)

## Getting started

### Prerequisites
- Node.js 20+
- A PostgreSQL database — the fastest path is a free [Neon](https://neon.tech) project (works identically in dev and once deployed)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then fill in DATABASE_URL / DIRECT_URL (see below) — everything else is optional

# 3. Push the schema to your database
npm run db:push

# 4. Seed a demo organization with sample data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open **http://localhost:3000** — you'll land on the login page.

## Environment variables

Only `DATABASE_URL` is required to run the app. Everything else has a working fallback:

| Variable | Required | What happens if it's missing |
|---|---|---|
| `DATABASE_URL` / `DIRECT_URL` | **Yes** | App won't start — this is the Postgres connection (pooled / direct) |
| `AUTH_SECRET` | Yes (has a dev default) | Session signing key — generate with `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Google sign-in button is hidden/non-functional; email/password still works |
| `OPENAI_API_KEY` | No | AI tools run in **mock mode** — real heuristics computed from your data instead of GPT-4o mini |
| `RESEND_API_KEY` | No | Emails (password reset, invitations, AI-generated sends) are logged to the server console instead of delivered |
| `UPLOADTHING_TOKEN` | No | Document upload UI shows a "configure to enable" message instead of an upload button |

See `.env.example` for the full list with descriptions.

## Demo account

The seed script creates a ready-to-explore organization:

- **Email:** `demo@smartcrm.dev`
- **Password:** `demo1234`
- Or just click **"Try the demo"** on the login page

It comes with 6 customers, leads across every pipeline stage, a won deal with an invoice and payment, tasks, and a meeting — enough real data for every dashboard chart and AI tool to produce meaningful output immediately.

## AI tools & mock mode

Every AI action goes through one shared helper (`src/lib/openai.ts`). When `OPENAI_API_KEY` is set, it calls GPT-4o mini in JSON mode. When it isn't, each feature falls back to a **heuristic computed from your actual data** — lead scores are weighted from real stage/value/probability, sentiment analysis does keyword matching on real notes, sales insights are ranked from real pipeline numbers — so the demo is genuinely useful, not just placeholder text. Every call (mock or real) is logged to the `AILog` table with its input, output, and token usage.

## Roles & permissions

| Capability | Owner | Manager | Sales Rep | Support |
|---|:---:|:---:|:---:|:---:|
| View customers, leads, tasks, meetings | ✅ | ✅ | ✅ | ✅ |
| Create records | ✅ | ✅ | ✅ | ❌ |
| Edit/delete records they don't own | ✅ | ✅ | ❌ | ❌ |
| Use AI tools | ✅ | ✅ | ✅ | ✅ |
| Invite team members | ✅ | ✅ | ❌ | ❌ |
| Change roles / remove members | ✅ | ❌ | ❌ | ❌ |
| Change billing plan | ✅ | ❌ | ❌ | ❌ |

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:migrate` | Create a migration (for production-style deploys) |
| `npm run db:seed` | Seed the demo organization |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Deployment

Built to deploy on **Vercel** with a Neon Postgres database — that pairing needs no code changes, since Neon's pooled connection string is exactly what serverless functions need. Steps:

1. Push this repo to GitHub
2. Import it into Vercel
3. Add the environment variables from `.env.example`
4. Deploy — Vercel runs `npm run build`, and `prisma generate` runs automatically via the `postinstall`-adjacent build step

## Known limitations

Honestly flagged, not hidden:
- No UI yet for switching between multiple organizations (the data model supports a user belonging to several orgs; there's no switcher component)
- No global command palette / search across records
- No real-time notifications (WebSockets/SSE) — everything is request/response
- No CSV import/export or PDF invoice generation
- Test coverage is minimal (Vitest is wired up, but the suite is not comprehensive)

---

Built with Next.js, TypeScript, Prisma, and a genuine attempt to make every AI feature actually useful.
