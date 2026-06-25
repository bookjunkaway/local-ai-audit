# Fix My Site Kit

Static landing site for Fix My Site Kit with a Netlify-powered intake backend, persistent order storage, and automated email notifications.

## Included pages

- Home page
- About page
- Contact page
- Privacy policy
- Terms
- Order intake page
- Thank-you page
- Dentist niche page
- Roofer niche page
- HVAC niche page
- robots.txt
- sitemap.xml
- Netlify intake API: `/api/intake`
- Netlify order APIs: `/api/orders` and `/api/orders/:orderNumber`
- Netlify Database schema and migrations
- Scheduled notification retry function

## Deploy on Netlify

1. Import this repository into Netlify.
2. Framework preset: Other.
3. Root directory: `./`
4. Build command: leave blank.
5. Output directory: leave blank.
6. Add environment variables in Netlify:
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `TO_EMAIL`
   - `ADMIN_API_TOKEN`
7. Deploy.

Netlify Database is configured through `@netlify/database` and Drizzle. The schema lives in `db/schema.ts`, and generated migrations live in `netlify/database/migrations/`.

## Suggested environment variables

- `RESEND_API_KEY` = your Resend API key
- `FROM_EMAIL` = a verified sender on your domain, such as `orders@fixmysitekit.com`
- `TO_EMAIL` = `Hudsonhotshotsmoving@yahoo.com`
- `ADMIN_API_TOKEN` = a private bearer token for reading and updating orders through the admin API
- `IMPLEMENTATION_KIT_URL` = optional download URL for instant Implementation Kit fulfillment
- `LOCAL_AI_VISIBILITY_FIX_KIT_URL` = optional download URL for the Local AI Visibility Fix Kit
- `HOMEPAGE_REWRITE_KIT_URL` = optional download URL for the Homepage Rewrite Kit
- `FAQ_SCHEMA_KIT_URL` = optional download URL for the FAQ + Schema Kit
- `GOOGLE_BUSINESS_KIT_URL` = optional download URL for the Google Business Profile Fix Kit

## Backend behavior

- `POST /api/intake` validates the order intake payload, stores the order in Netlify Database, and starts owner/customer email notifications in the background.
- Download products are marked fulfilled immediately when a download URL is configured.
- Custom audit orders stay in `new` status until updated.
- `GET /api/orders` lists recent orders when called with `Authorization: Bearer <ADMIN_API_TOKEN>`.
- `GET /api/orders/:orderNumber` returns one order when authorized.
- `PATCH /api/orders/:orderNumber` accepts `{ "status": "new" | "in_progress" | "fulfilled" | "cancelled" }` when authorized.
- The scheduled `order-notifications` function retries failed owner notifications every 15 minutes.

## Before launch

- Replace the placeholder domain in `sitemap.xml` and `robots.txt` with your real domain.
- Point your custom domain in Netlify.
- Test both Stripe links.
- Test the intake form after adding your Resend and admin environment variables.
