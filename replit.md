# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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
- **Auth**: Fully custom — `express-session` + `bcryptjs` + `connect-pg-simple` (no Clerk)
- **Email**: Resend API (`RESEND_API_KEY` secret) — sign-up OTP verification + password reset OTP

## Auth Flow

- Sign-up: email+password → Resend OTP email → verify OTP → session created
- Sign-in: email+password → session created (cookie `sid`)
- Forgot password: email → Resend OTP email → verify OTP + new password → hash updated
- Sessions stored in `user_sessions` DB table (connect-pg-simple)

## DB Tables

- `users` — id, email (unique), password_hash, email_verified, created_at
- `analyses` — id, user_id (text), text, summary, is_scam, confidence_level, message_hash, created_at
- `password_resets` — id, email, otp, expires_at, used, created_at
- `email_verifications` — id, email, otp, expires_at, used, created_at
- `user_sessions` — managed by connect-pg-simple (auto-created)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
