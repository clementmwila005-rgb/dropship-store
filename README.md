# DropshipStore

A full e-commerce dropshipping website with customer accounts, order tracking, Lipila checkout, and an admin dashboard for listing products sourced from Chinese supplier sites (AliExpress / 1688 etc.).

## Features

**Customers**
- Register / login / logout (password hashed with bcrypt, sessions via signed JWT cookies)
- Browse products by category, search, and sort
- Product pages with sale prices, stock status, and related items
- Cart with quantity controls
- Checkout with shipping address + payment through **Lipila** — card (Visa / Mastercard / American Express) or **Mobile Money** (Airtel Money / MTN Money / Zamtel Kwacha) — all in Zambian Kwacha
- Order confirmation page
- My Orders: full order history with a status timeline (Paid → Processing → Shipped → Delivered) and live tracking number

**Admin**
- Dashboard with revenue / orders / products / customers stats
- Products CRUD: name, description, price, compare-at price, **supplier cost**, **supplier URL**, image URL, stock, visibility, category
- Auto-computed profit margin preview while listing
- Orders management: update status and paste the supplier's tracking number + carrier
- Categories management

**Dropshipping workflow**
1. Find a product on AliExpress/1688 → paste it into the admin dashboard (image URL, supplier link, your cost, your sell price).
2. Customer orders on your store → Lipila collects the payment instantly.
3. You buy the item from your Chinese supplier with **your customer's shipping address** → supplier ships directly to your customer.
4. Paste the tracking number into the admin panel → the customer sees it under My Orders.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Prisma 6** ORM with **SQLite** (swap to PostgreSQL for production — see below)
- **Custom JWT auth** (`jose` + `bcryptjs`, httpOnly cookie) — no NextAuth dependency
- **Lipila** (Zambian payment gateway) — card collections with a hosted checkout page and **mobile money collections** (Airtel / MTN / Zamtel) that prompt the customer's phone for a PIN, plus webhooks with HMAC-SHA256 verification. A built-in **offline mode** lets you test the entire flow without connecting to Lipila.

## Getting started

Requirements: Node.js 18+ (built and tested on Node 24), npm.

```bash
# 1. install dependencies
npm install

# 2. set up the database
#    (create the SQLite DB + tables, generates the Prisma client)
npx prisma migrate dev --name init

# 3. seed demo data (admin account, 3 categories, 4 sample products)
npm run db:seed

# 4. run the dev server
npm run dev
```

Open http://localhost:3000.

**Demo accounts (seeded):**

| Role     | Email             | Password     |
| -------- | ----------------- | ------------ |
| Admin    | admin@example.com | admin12345   |
| Customer | *(create one on the register page)* | |

Change these with env vars `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding.

## Configuration (.env)

```
DATABASE_URL="file:./dev.db"                 # SQLite for local dev
AUTH_SECRET="change-me-to-a-long-random-string"  # signs session cookies — change this!
LIPILA_MODE="offline"                        # offline | sandbox | live
LIPILA_API_KEY=""                            # from the Lipila merchant dashboard (Wallets -> view more details)
LIPILA_WEBHOOK_SECRET=""                     # base64 secret from dashboard -> Settings -> Webhooks
LIPILA_CALLBACK_URL=""                       # public URL Lipila calls on payment result
APP_URL="http://localhost:3000"              # used for Lipila back/callback URLs
```

- **`LIPILA_MODE=offline`** (default, no connection to Lipila): checkout completes instantly with a simulated payment. Great for testing the whole flow.
- **`LIPILA_MODE=sandbox`**: Lipila sandbox (`https://api.lipila.dev`). Use a sandbox key from https://dashboard.lipila.dev.
- **`LIPILA_MODE=live`**: real money via `https://blz.lipila.io`. Only switch when you're ready to launch.

> The API key is **server-side only** (`x-api-key` header sent from `src/lib/lipila.ts`). It is never exposed to the browser. Keep it out of client code and out of source control.

## Connecting real Lipila (sandbox first)

1. Sign up at https://dashboard.lipila.dev (sandbox) or https://dashboard.lipila.io (live).
2. In the dashboard go to **Wallets → view more details → API Keys** and copy the key (starts with `lsk_`).
3. In **Settings → Webhooks**, grab the **webhook signing secret** (base64) — used to verify that payment notifications really come from Lipila.
4. Put both in `.env` and set a public callback URL:
   ```
   LIPILA_MODE=sandbox
   LIPILA_API_KEY=lsk_your_sandbox_key
   LIPILA_WEBHOOK_SECRET=your_base64_secret
   LIPILA_CALLBACK_URL=https://your-public-url/api/lipila/webhook
   ```
5. `LIPILA_CALLBACK_URL` must be reachable from the internet — for local development use a tunnel (ngrok, cloudflared) pointing at `http://localhost:3000`.
6. Restart the dev server. Checkout lets the customer choose **Card** (redirects to Lipila's hosted page) or **Mobile Money** (Lipila sends a PIN prompt to the customer's phone; the order page waits and polls until the payment confirms). The webhook marks the order `PAID` (or the return page polls `GET /api/lipila/status?order=...` until it confirms).
7. When ready for production: use the live dashboard key, flip `LIPILA_MODE=live`, and update `APP_URL` to your real HTTPS domain.

> Order status goes `PENDING → PAID` on payment confirmation (webhook or status poll), and `PENDING → CANCELLED` on failure/cancellation. In `live` mode a missing webhook secret causes the webhook to be rejected.

## Production notes

- **Database**: switch `datasource db` in `prisma/schema.prisma` to PostgreSQL (`provider = "postgresql"`, `url = env("DATABASE_URL")` pointing at your Postgres), then run `npx prisma migrate deploy`.
- **Deploy**: this is a standard Next.js app — Vercel, Railway, Fly.io, or a VPS all work. Make sure `AUTH_SECRET` is a long random string and HTTPS is enabled (the session cookie is only marked `Secure` when `APP_URL` starts with `https://`).
- **Images**: product images are loaded directly from supplier URLs (`images.unoptimized = true`). For production, consider downloading images to your own storage at import time to avoid hotlink failures.
- **Webhooks**: `POST /api/lipila/webhook` receives payment results (verified with HMAC-SHA256 when `LIPILA_WEBHOOK_SECRET` is set). Card payments also redirect the browser back to `/checkout/return`, which polls `GET /api/lipila/status` until the order is confirmed.

## Project structure

```
src/
  app/
    page.tsx                 # storefront home
    products/                # product listing + detail
    cart/                    # cart
    checkout/                # checkout, return, cancel, success
    account/orders/          # my orders + tracking
    login/ register/         # auth pages
    admin/                   # dashboard, products, orders, categories
    api/                     # auth, cart, checkout, lipila, admin APIs
  components/                # shared + admin components
  lib/                       # prisma, auth (JWT), lipila, formatting
prisma/
  schema.prisma              # data model
  seed.mjs                   # demo data
```

## Scripts

| Command            | Purpose                               |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Dev server (hot reload)               |
| `npm run build`    | Production build                      |
| `npm run start`    | Serve production build                |
| `npm run lint`     | ESLint check                          |
| `npm run db:seed`  | Reset + reseed demo data              |
