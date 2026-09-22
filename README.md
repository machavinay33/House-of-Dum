# House of Dum — Online Ordering Website

A production-ready ordering website for **House of Dum** (Hyderabadi Dum Biryani & Kababs), built with React + TypeScript + Vite + Tailwind CSS + Framer Motion on the frontend and Supabase (Postgres, Auth, Storage) on the backend. Deploys to Vercel.

Customers browse the menu, add items to a cart, and check out with just their name, phone and address — no account and no online payment. Every order gets a short human-readable code (e.g. `HOD-7K4P92`) they can use to track it. Restaurant staff manage orders, the menu, the gallery and site settings from `/admin`.

---

## 1. Install

Requires Node.js 18.18+ and npm.

```bash
npm install
cp .env.example .env
```

You'll fill in `.env` in step 2.

---

## 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

   Paste both into `.env`. **Never** put the `service_role` key into this project — it must never reach the browser.

3. Go to **Project Settings → Authentication → URL Configuration** and add your local dev URL (`http://localhost:5173`) and your production URL (from Vercel) to the allowed redirect/site URLs.

---

## 3. Run the SQL migrations

In the Supabase dashboard, open **SQL Editor** and run the files in `supabase/migrations/` **in order**, each as its own query:

1. `0001_schema.sql` — tables (menu, orders, gallery, settings, admins)
2. `0002_functions.sql` — `place_order`, `track_order`, `is_admin`, order-code generator
3. `0003_rls.sql` — Row Level Security policies (this is what keeps customer data safe)
4. `0004_storage.sql` — creates the `restaurant-media` storage bucket and its policies

Then run `supabase/seed.sql` once to load the real House of Dum menu (extracted from the restaurant's menu photos — see "About the seed data" below).

Alternatively, with the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project:

```bash
supabase db push          # applies everything in supabase/migrations
psql "$DATABASE_URL" -f supabase/seed.sql
```

---

## 4. Create an admin user

The admin dashboard uses Supabase Auth, but a signed-in user only gets admin access if their id is also listed in the `admins` table.

1. In the Supabase dashboard, go to **Authentication → Users → Add user** (or **Invite**) and create an account for the restaurant owner/manager with an email and password.
2. Copy that user's **UID**.
3. In the **SQL Editor**, run:

   ```sql
   insert into public.admins (user_id) values ('paste-the-uid-here');
   ```

4. Sign in at `/admin/login` with that email and password.

Repeat step 3 for each additional staff member who needs admin access.

---

## 5. Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key (safe for the browser) |
| `VITE_SITE_URL` | No | Your production URL, used for canonical/Open Graph tags. Defaults to the current origin. |

All variables are read at build time by Vite, so restart `npm run dev` (or redeploy) after changing `.env`.

---

## 6. Run locally

```bash
npm run dev
```

Open http://localhost:5173. The menu, gallery and settings load live from Supabase; `/admin/login` lets you sign in with the account you created in step 4.

Other scripts:

```bash
npm run build       # production build to dist/
npm run preview     # preview the production build locally
npm run typecheck   # TypeScript check with no emit
```

---

## 7. Deploy to Vercel

1. Push this project to a GitHub repository.
2. In [Vercel](https://vercel.com), **Add New Project** → import the repo. Vercel auto-detects Vite (framework settings are also pinned in `vercel.json`).
3. Under **Environment Variables**, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_SITE_URL` (set it to the Vercel URL, e.g. `https://house-of-dum.vercel.app`).
4. Deploy. `vercel.json` includes an SPA rewrite so client-side routes like `/menu` and `/admin` work on refresh.
5. Add your Vercel domain to Supabase's **Authentication → URL Configuration** allowed URLs so admin sign-in works in production.

---

## 8. Configure Supabase Storage

Migration `0004_storage.sql` already creates a public bucket named `restaurant-media` with policies so that:

- **Anyone** can view images (menu photos, gallery photos, logo) by URL — needed for the public website.
- **Only admins** (rows in `public.admins`) can upload, replace or delete files.

The admin dashboard (Menu, Gallery, Settings tabs) uploads directly to this bucket using the Supabase JS client — there is nothing extra to configure. Images are resized/compressed to WebP in the browser before upload (see `src/utils/image.ts`) to keep the site fast.

If you ever need to recreate the bucket manually: **Storage → New bucket** → name it exactly `restaurant-media`, mark it **Public**, then re-run the policy statements from `0004_storage.sql`.

---

## 9. How the ordering system works

**Customer side (no account required):**

1. Cart is kept in `localStorage` (`src/hooks/useCart.tsx`) so it survives page reloads/navigation for up to 24 hours.
2. On the checkout page, before placing the order, the cart is re-validated against the live `menu_items`/`menu_item_variants` tables (`src/services/cart.ts`) — unavailable items are removed and stale prices are refreshed, with a visible notice.
3. Placing the order calls the Postgres function `place_order(...)` (see `supabase/migrations/0002_functions.sql`) via `supabase.rpc`. **The browser never sends a price.** It only sends `item_id`, `variant_id` and `quantity`; `place_order` looks up the current name/price/availability itself, computes the total, generates a unique `order_code`, and snapshots each line into `order_items` (so past orders never change if the menu is edited later).
4. The customer is shown their order code and can look it up any time at `/track-order`, which calls `track_order(code)` — a read-only function that returns only what a customer needs (status, items, total, timeline) and nothing sensitive.

**Restaurant side (admin):**

1. `/admin/login` signs in with Supabase Auth, then checks `is_admin()` — if the account isn't in `public.admins`, it's signed back out immediately.
2. The **Orders** tab lists orders (via RLS, admins can see everything), shows live counts/revenue for today, and lets staff change status (Received → Confirmed → Preparing → Out for Delivery → Delivered, or Cancelled). Status changes are pushed to any open tracking page in real time via Supabase Realtime, with an 8-second poll as a fallback and a 30-second poll to refresh the admin list.
3. The **Menu** tab manages categories, items, prices, descriptions, photos, availability, "featured" flag and variants (e.g. 4 Pieces / 8 Pieces) — nothing is hardcoded in the React code.
4. The **Gallery** tab uploads/reorders/deletes photos shown on `/gallery` and the home page.
5. The **Settings** tab edits the restaurant's name, logo, tagline, contact details, hours and description, used throughout the site.

Security is enforced primarily by **Postgres Row Level Security** (`0003_rls.sql`), not just by the frontend: anonymous visitors can only read the menu/gallery/settings and can only create/read orders through the two `SECURITY DEFINER` functions above; every other table operation requires a session that is listed in `public.admins`.

---

## About the seed data

`supabase/seed.sql` contains the **exact items and prices from the restaurant's official menu photos** (names, categories and ₹ prices only — the photos had no written descriptions, so `description` is left blank for every item; add descriptions from **Admin → Menu → Edit** whenever you like). Variant pricing (4 Pieces / 8 Pieces) is included where the menu showed it. Vegetarian/non-vegetarian markers were inferred from each dish's name and can be corrected the same way. Business details (address, phone, branches) came from the menu's "Business details" section; WhatsApp, Instagram and opening hours were not printed on the menu and should be filled in from **Admin → Settings**.

---

## Project structure

```
src/
  components/   Reusable UI split by area: ui/, layout/, menu/, order/, home/, admin/
  pages/        One file per route, plus pages/admin/ for the dashboard
  layouts/      PublicLayout (navbar/footer) and AdminLayout
  hooks/        useCart, useAuth, useSettings, useToast, useMenu, useGallery, useAsyncData
  lib/          Supabase client, constants, formatting, SEO helper, error mapping
  services/     All Supabase queries/RPC calls (menu, orders, cart validation, admin, storage, auth, settings, gallery)
  types/        Shared TypeScript types
  utils/        Validation and client-side image compression

supabase/
  migrations/   Run in order: schema → functions → RLS → storage
  seed.sql      Real House of Dum menu data

public/         Logo, favicons, OG image, robots.txt
```

## Notes

- No online payment is implemented anywhere, by design — this is a call/delivery-address ordering flow.
- Every price shown to a customer is illustrative; the database is the source of truth and re-checked at order time.
- The service-role key is never used or referenced in this frontend project.
