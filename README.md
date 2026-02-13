# Baltra Frontend Services

## Overview
- Admin and candidate-facing web experience for the Baltra talent platform.
- Built with Next.js App Router, React 19, TypeScript, Tailwind CSS, Radix UI, and TanStack Query.
- Integrates with AWS Cognito (via Amplify) for authentication, Baltra API Gateway for data, Mixpanel for analytics, and Google Maps for location-aware flows.

## Tech Stack Highlights
- **Framework**: Next.js 15 (App Router) with edge-friendly layouts and streaming.
- **Styling**: Tailwind CSS + CSS Modules; custom primitives in `components/`.
- **State/Data**: React Context (`context/CompanyContext.tsx`) and TanStack Query hooks in `querys/`.
- **Forms**: `react-hook-form`, `zod`, and custom progressive form UI in `views/progressive-form/`.
- **Auth**: AWS Amplify helpers in `auth/` wrapping Cognito hosted UI flows.
- **Analytics**: `lib/mixpanel.ts` for browser tracking.

## Repository Layout
- `app/`: Next.js routes, including `app/(dashboard)` for the admin surface and marketing/auth layouts.
- `auth/`: Cognito-powered authentication screens and wrappers. 
- `components/`: Shared UI primitives (Radix-based dialogs, tables, charts, etc.).
- `features/meta-ads/`: Vertical-specific experiences for Meta Ads automations.
- `lib/`: API clients (`admin-api.ts`, `aws-api.ts`), utility helpers, Mixpanel integration.
- `querys/`: TanStack Query hooks for core entities (candidates, roles, screening).
- `views/progressive-form/`: Multi-step candidate onboarding experience.
- `docs/`: Frontend-specific API and flow documentation.

## Prerequisites
- Node.js 20+ (recommended) and npm 10+. Bun lockfile is present but npm is the supported toolchain.
- Access to the Baltra AWS Cognito pool, API Gateway, and Google Maps API key.
- Mixpanel project token if analytics are required locally.

## Environment Variables
Create a `.env.local` (Next.js automatically loads it). Required keys are mirrored in `config/env.ts`.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID` | Cognito app client ID used by Amplify. |
| `NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID` | Cognito user pool ID. |
| `NEXT_PUBLIC_AWS_COGNITO_REGION` | AWS region for the pool (e.g., `us-east-1`). |
| `NEXT_PUBLIC_AWS_COGNITO_DOMAIN` | Hosted UI domain for login/logout redirects. |
| `NEXT_PUBLIC_AWS_API_GATEWAY_URL` | API Gateway base URL for AWS-secured endpoints. |
| `NEXT_PUBLIC_API_URL` | Baltra backend base URL exposed to the browser. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps key for location components. |

Optional:
- `NEXT_PUBLIC_MIXPANEL_TOKEN` for analytics.
- Any experiment flags consumed through `process.env.NEXT_PUBLIC_*`.

## Getting Started
1. Install dependencies: `npm install`
2. Create `.env.local` with the variables listed above.
3. Run the dev server: `npm run dev`
4. Open `http://localhost:3000` and authenticate via the Cognito hosted UI.

## Common Tasks
- `npm run dev`: Start Next.js with hot reload.
- `npm run build`: Production build (runs type-checking and route bundling).
- `npm run start`: Serve the built app (useful for production parity tests).
- `npm run lint`: ESLint (Next.js config) + TypeScript checks.
- `npm run format`: Format sources with Prettier.

## Testing & QA Tips
- Use `npm run lint` before submitting a PR; lint covers most regressions since there are no dedicated unit test scripts yet.
- Verify flows with Cognito + API Gateway staging credentials to ensure cross-origin config is valid.
- For analytics-heavy changes, mock Mixpanel via `NEXT_PUBLIC_MIXPANEL_TOKEN=test` to avoid polluting production dashboards.

## Deployment Notes
- The project is optimized for Vercel, but any Next.js-compatible platform works. Ensure environment variables are set in the target platform.
- When deploying behind AWS Amplify hosting, mirror the same build command (`npm run build`) and start command (`npm run start`).
- Statically generated assets (public logos, icons) live under `public/`; update them before cutovers to avoid caching surprises.

## Troubleshooting
- **Auth redirect loops**: Confirm the Cognito domain matches the environment base URL and that callback URLs are whitelisted.
- **API 403/401 errors**: Regenerate temporary API credentials or confirm the user pool client has the proper scopes.
- **Styling drift**: Run `npm run format` to apply Tailwind class sorting and Prettier formatting for consistent diffs.
