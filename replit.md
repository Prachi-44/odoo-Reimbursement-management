# Reimbursement Management System

## Overview

Enterprise-grade SaaS Reimbursement/Expense Management System with multi-level approval workflows, OCR receipt scanning, multi-currency support, and role-based dashboards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **State management**: Zustand + React Query
- **Auth**: JWT (bcryptjs + jsonwebtoken)

## User Roles

1. **Admin** - full access, user management, approval rules, overrides
2. **Manager** - approve/reject expenses, view team expenses
3. **Employee** - submit expenses, view own history

## Key Features

- JWT authentication with company signup (creates company + admin)
- Multi-step approval workflow engine (sequential steps)
- Conditional rule engine: percentage, specific approver, hybrid
- OCR receipt scanning using Tesseract.js
- Multi-currency conversion via exchangerate-api.com
- Country/currency list from restcountries.com API
- Receipt upload (base64 stored on disk)
- Role-based dashboards with stats

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/
│   │       ├── lib/auth.ts              # JWT, bcrypt, middleware
│   │       ├── services/
│   │       │   ├── currency.ts          # Exchange rates + caching
│   │       │   ├── workflow.ts          # Approval workflow engine
│   │       │   └── ocr.ts              # Tesseract OCR service
│   │       └── routes/
│   │           ├── auth.ts             # /auth/signup, /auth/login, /auth/me
│   │           ├── users.ts            # /users CRUD
│   │           ├── expenses.ts         # /expenses + /dashboard/stats
│   │           ├── approvalRules.ts    # /approval-rules CRUD
│   │           ├── currencies.ts       # /currencies, /currencies/rates
│   │           └── ocr.ts             # /ocr/scan
│   └── expense-app/        # React + Vite frontend (at /)
│       └── src/
│           ├── pages/
│           │   ├── login.tsx, signup.tsx
│           │   ├── dashboard.tsx
│           │   ├── expenses/ (list, new, detail)
│           │   ├── approvals.tsx
│           │   └── admin/ (users, rules, settings)
│           ├── components/layout/ (sidebar, topbar, app-layout)
│           └── hooks/use-auth-state.ts
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/src/schema/      # Drizzle schema files
│       ├── companies.ts
│       ├── users.ts
│       ├── expenses.ts
│       ├── approvals.ts
│       └── approvalRules.ts
```

## Database Tables

- `companies` - id, name, country, default_currency
- `users` - id, name, email, password (hashed), role, manager_id, company_id
- `expenses` - id, user_id, amount, currency, converted_amount, category, description, date, receipt_url, status, current_step
- `approvals` - id, expense_id, approver_id, status, comments, step_order
- `approval_rules` - id, company_id, rule_type, threshold, specific_approver_id, is_active
- `approval_steps` - id, rule_id, approver_role, approver_id, step_order

## External APIs

- Country/Currency list: `https://restcountries.com/v3.1/all?fields=name,currencies`
- Exchange rates: `https://api.exchangerate-api.com/v4/latest/{BASE}`
- Rates are cached in memory for 30 minutes

## Auth Flow

- Token stored in `localStorage` as `auth_token`
- `setAuthTokenGetter` in `lib/api-client-react/src/custom-fetch.ts` injects it automatically
- Company+admin created together on signup

## Development Commands

- `pnpm --filter @workspace/api-server run dev` - Start API server
- `pnpm --filter @workspace/expense-app run dev` - Start frontend
- `pnpm --filter @workspace/db run push` - Push schema to DB
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API types
