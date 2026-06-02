# Oremus Frontend — React (Vite) → Next.js 14 Migration Report

This app (`Oremus-frontend-next/`) is a Next.js 14 App Router port of the original Vite/React SPA
(`Oremus-frontend/`). The Vite app is kept untouched as a pixel-perfect reference. The migration
goal was **zero functional regression and zero UI regression**.

## Strategy

Faithful **client-render port**: all framework-agnostic code (components, Redux, features,
services, utils, styles) was copied verbatim, guaranteeing identical UI and business logic. Only
framework-coupled seams were transformed:

- React Router → Next App Router routing
- `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- Vite dev proxy → `next.config.js` rewrites
- SPA bootstrap (`main.jsx` + `BrowserRouter`) → App Router layouts + a client `Providers` wrapper

Authenticated pages remain `'use client'`. The JWT lives in `localStorage`, so auth-gated data is
never fetched on the server — there is no SSR data divergence. SEO-relevant `<head>`/metadata is
still rendered on the server.

## Folder structure

```
src/
  app/                      # App Router (routing only)
    layout.jsx              # Root layout: <html>, metadata, Inter font, <Providers>
    page.jsx                # / -> redirect(/dashboard)
    not-found.jsx           # 404 (replaces RR path="*")
    robots.js, sitemap.js   # SEO
    login/page.jsx
    auth/{zoho,quickbooks,xero}/callback/page.jsx   # OAuth callbacks (auth-gated, no chrome)
    (dashboard)/            # Route group = authenticated chrome (Sidebar + Navbar)
      layout.jsx            # <RouteGuard><DashboardLayout>{children}</DashboardLayout></RouteGuard>
      dashboard/ ratios/ transactions/ accounts/ settings/ ...
      reports/page.jsx               # redirect -> /reports/zoho
      reports/[provider]/page.jsx    # dynamic segment (permission: Reports)
      admin/ clients/ employees/     # roles: ['admin']
      billing/                       # roles: ['client']
  views/                    # Ported page components (was src/pages/*) — renamed to avoid
                            # colliding with Next's reserved Pages Router directory
  components/               # Verbatim UI + providers/Providers.jsx, auth/RouteGuard.jsx
  features/                 # Redux slices (verbatim)
  redux/store.js            # Store (was app/store.js)
  services/ utils/ hooks/   # Verbatim
  layouts/DashboardLayout.jsx  # 'use client', <Outlet/> -> {children}
  styles/globals.css        # Was index.css
```

App Router `page.jsx` files are thin **server** wrappers: they export per-route `metadata` (SEO)
and render the ported client view, wrapping in `<RouteGuard>` / `<ErrorBoundary>` exactly where the
original `AppRoutes.jsx` did.

## Routing map (URLs preserved 1:1)

| Original (react-router) | Next App Router file | Guard |
|---|---|---|
| `/login` | `app/login/page.jsx` | self-redirect if authed |
| `/auth/{zoho,quickbooks,xero}/callback` | `app/auth/*/callback/page.jsx` | base auth (RouteGuard) |
| `/dashboard` `/ratios` `/transactions` `/accounts` `/settings` + placeholders | `app/(dashboard)/*/page.jsx` | base auth (group layout) |
| `/reports` → `/reports/zoho` | `app/(dashboard)/reports/page.jsx` (redirect) | — |
| `/reports/:provider` | `app/(dashboard)/reports/[provider]/page.jsx` | permission `Reports` |
| `/admin` `/clients` `/employees` | `app/(dashboard)/*/page.jsx` | roles `['admin']` |
| `/billing` | `app/(dashboard)/billing/page.jsx` | roles `['client']` |
| `*` | `app/not-found.jsx` | — |

## Key changes / compatibility notes

1. **`react-router-dom` removed.** 11 files transformed to `next/navigation`:
   - `useNavigate()` → `useRouter()` (`navigate(x)`→`router.push(x)`, `navigate(x,{replace})`→`router.replace(x)`)
   - `useLocation().pathname` → `usePathname()`
   - `useSearchParams()` (RR `[params]` tuple) → Next `useSearchParams()` (returns `URLSearchParams`)
   - `useParams()` → Next `useParams()` (dynamic `[provider]` segment)
   - `<Navigate>` → `useEffect` + `router.replace` (client) or `redirect()` (server)
   - `<NavLink>` → a small shim in `Sidebar.jsx` wrapping `next/link` + `usePathname` that preserves
     the render-prop `isActive` API, so all sidebar JSX is unchanged.
   - `<Link to=>` → `next/link` `<Link href=>`.
2. **`'use client'`** added to every interactive component/view/hook. Route wrappers stay server
   components (for `metadata`).
3. **`src/pages/` renamed to `src/views/`** — `src/pages` is a reserved Next directory (Pages
   Router); keeping it would double-mount every page and break the build. (Discovered and fixed
   during build.)
4. **Hydration safety:** `Providers` uses a mount gate (renders children only after mount), exactly
   replicating the SPA's "blank until JS mounts" behavior, so persisted `localStorage` state
   (theme/auth/selected org) never causes a hydration mismatch. `ThemeSync` applies the `dark`
   class like the old `App.jsx` effect.
5. **API / proxy:** Express backend untouched. `next.config.js` rewrites replicate the Vite proxy:
   `/api/* → :5001`, `/zoho-token → accounts.zoho.in`, `/zoho-api/* → zohoapis.in`. `axiosClient`
   (interceptors, `X-Org-Id`, token refresh, error handling) copied verbatim.
6. **Env:** `VITE_*` → `NEXT_PUBLIC_*` (client) in `.env.local` / `.env.production`. Server-only
   `API_PROXY_TARGET` drives rewrites — no secrets exposed to the client.
7. **OAuth callbacks** wrap content in `<Suspense>` (required because `useSearchParams()` triggers
   Next's static-render bailout).
8. **Dev helper:** `window.__resetZoho` (was in `main.jsx`) ported into `Providers` as a dev-only,
   `typeof window`-guarded effect.

## Preserved as-is (intentional)

- **Styling:** Tailwind config (colors, shadows, keyframes, animations) copied verbatim; same
  `index.css`/`globals.css`; Inter loaded via the same Google Fonts `<link>` (not `next/font`) to
  keep the literal `font-family: 'Inter'` matching → pixel-perfect typography.
- **`<img>` tags** kept (not migrated to `next/image`) to guarantee identical rendering. Listed as
  a future optimization.
- All forms, validation, filters, search, Redux slices/thunks/selectors, RBAC, animations.

## Performance

- App Router automatic per-route code-splitting (see build output: heavy routes like `/dashboard`
  and `/reports/[provider]` are isolated chunks; shared JS ≈ 87 kB).
- Static prerender of route shells; client hydration for interactivity.
- Future (not done, to avoid behavioral/visual drift): `dynamic()` for recharts/modals, `next/image`.

## Setup

```bash
cd Oremus-frontend-next
npm install
# dev (proxies /api to the Express backend on :5001)
npm run dev            # http://localhost:5174
```
Backend (unchanged): `cd Oremus-backend && npm run dev` (:5001).

Env: copy/verify `.env.local` (local) — `NEXT_PUBLIC_API_URL=/api`,
`API_PROXY_TARGET=http://localhost:5001`, `NEXT_PUBLIC_ZOHO_*`, etc.

## Deployment

```bash
npm run build          # produces .next/
npm run start          # next start -p 5174
```
- Set production env from `.env.production` (`NEXT_PUBLIC_API_URL=https://api.oremusai.vensframe.com/api`,
  `API_PROXY_TARGET=https://api.oremusai.vensframe.com`, `NEXT_PUBLIC_ZOHO_REDIRECT_URI=https://oremusai.vensframe.com/auth/zoho/callback`).
- Node host (Vercel or a Node server). The `/api` rewrite proxies to the backend; alternatively
  point `NEXT_PUBLIC_API_URL` directly at the backend origin and drop the rewrite.

## Verification status

- `npm run build` → clean (26 routes compiled; robots.txt + sitemap.xml generated).
- `next dev` boots; `/login` and `/reports/zoho` return 200.
- Remaining manual smoke test (needs backend running): login → dashboard parity, sidebar active
  states, theme persistence, OAuth callbacks, admin/client RBAC, 404, and visual diff vs. the Vite
  app across breakpoints.
