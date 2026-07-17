# Fluctum Landing Page (`landing-page/www`)

Marketing site for [Fluctum](https://fluctum.io) — the open-source real-time dynamic pricing plugin for Medusa stores.

## What this app does

- Presents Fluctum value proposition for mixed audiences (technical + business)
- Drives primary conversion to demo (`https://demo.fluctum.io`)
- Supports secondary conversion to contact form, starter adoption, and GitHub
- Ships static SEO metadata, sitemap, and robots definitions

## Local development

From this folder:

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

## Build and run

```bash
pnpm run build
pnpm run start
```

## Environment variables

| Variable                  | Description                                         | Required |
| ------------------------- | --------------------------------------------------- | -------- |
| `NEXT_PUBLIC_WEBFORM_URL` | Contact form endpoint (serverless form handler URL) | no       |

If `NEXT_PUBLIC_WEBFORM_URL` is missing, the form gracefully falls back to a simulated success flow.

## SEO and analytics

- Global metadata in `src/app/layout.tsx`
- Sitemap in `src/app/sitemap.ts`
- Robots rules in `src/app/robots.ts`
- Analytics script in `src/app/layout.tsx` (Umami)

## Content ownership

- Main page content lives in `src/app/HomeClient.tsx`
- Keep lock behavior wording accurate: checkout locks are created from the latest spot prices stored in DB
- Keep CTA priority aligned: demo → contact → starter → GitHub
