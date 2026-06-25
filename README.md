# Local AI Audit

Static landing site for Local AI Audit with a Resend-powered intake form endpoint for Vercel.

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
- Vercel API endpoint: `api/intake.js`

## Deploy on Vercel

1. Import this repository into Vercel.
2. Framework preset: Other.
3. Root directory: `./`
4. Build command: leave blank.
5. Output directory: leave blank.
6. Add environment variables in Vercel:
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `TO_EMAIL`
7. Deploy.

## Suggested environment variables

- `RESEND_API_KEY` = your Resend API key
- `FROM_EMAIL` = a verified sender on your domain, such as `orders@yourdomain.com`
- `TO_EMAIL` = `Hudsonhotshotsmoving@yahoo.com`

## Before launch

- Replace the placeholder domain in `sitemap.xml` and `robots.txt` with your real domain.
- Point your custom domain in Vercel.
- Test both Stripe links.
- Test the intake form after adding your Resend environment variables.
