# More Than Mildly

A mobile-first editorial publication and advertising platform, built with Astro, React, TypeScript, custom CSS, Netlify Database and Drizzle ORM.

- Publication: https://morethanmildly.netlify.app
- Admin portal: https://morethanmildly-admin.netlify.app
- Repository: https://github.com/seanr-dev/morethanmildly

## Run locally

Use Node 22.12 or newer.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:4173. The Netlify adapter starts a local database. Development applies the checked-in migrations once, including 16 editable original launch essays and all 11 requested categories. Local data stays under `.netlify/db`. The local database is separate from production. Generate a random `VISITOR_SECRET` for local like/enquiry testing; use a different production secret.

For Netlify Identity and Functions emulation, sign in to the Netlify CLI, link the primary project, then run `npm run netlify:dev`. Admin authentication requires an enabled Identity instance and an account with the `admin` role. There is no development authentication bypass.

```sh
npm run check
npm test
npm run build
```

## Features

- Server-rendered home, category and article pages; About, advertising enquiry, privacy and cookie pages.
- Text search, both category types, newest/most-liked ordering, infinite loading, and crawlable paginated links. After three automatic batches, readers can deliberately load more so the footer stays reachable.
- Private, persistent article likes with transactional deduplication. Counts are excluded from public API data and markup.
- Authenticated visual article editor: drafts/publishing, block editing/reordering, one header image, up to three inline images, required primary and optional secondary category.
- Category CRUD with database constraints preventing invalid category types or deletion of categories still in use.
- Advertising placement CRUD, clearly labelled inventory, and campaign enquiries stored in the database. Enquiries are reviewed and answered from the portal; the application does not send acknowledgement emails.
- Netlify Blobs image uploads; JPEG, PNG and WebP, 5 MB limit, descriptive alternative text.
- Light/dark themes using the supplied logos; system preference and remembered manual selection.
- Installable PWA, offline fallback and optional Web Push around 08:00, 13:00 and 19:00 in each subscriber's recorded time zone.
- Consent-controlled GA4 events; optional Meta/TikTok integrations; Global Privacy Control respected. Tracking is inactive until IDs are configured and the visitor opts in.
- Metadata, canonical URLs, Open Graph, Article/Organization structured data, dynamic sitemap and robots rules.

## Mobile behavior

Navigation collapses into a labelled, keyboard-operable menu. The category strip scrolls horizontally within its own area. Article cards use one column on phones, two on tablets and three on larger screens. The feature story stacks its image above its copy. Images preserve their aspect ratio; long text and forms fit the available width. Search spans the phone width, with labelled sort/filter controls beneath. Ad spaces resize within the reading column. Dialogs fit the screen and retain native focus management.

Advertising is sold through campaign enquiries, so the mobile conversion flow is a short contact form. This publication has no retail product cart or checkout; no prices, inventory guarantees or payment collection are invented.

## Structure

```text
src/pages/                 SSR pages and authenticated/public API routes
src/components/            React islands and Astro content components
src/components/admin/      Visual editorial workspace
src/db/                    Drizzle schema and database connection
src/lib/                   Validation, consent, queries and request protection
src/data/                  Original launch content
src/styles/                Hand-written responsive CSS
netlify/database/migrations/ Versioned schema and launch-content SQL
netlify/functions/         Scheduled Web Push dispatch
admin-host/                Separate Netlify admin-subdomain reverse proxy
public/                    Logos, photographs, manifest and service worker
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for activation, operations and deployment instructions, [VERIFICATION.md](VERIFICATION.md) for test evidence and outstanding device/account checks, and [CREDITS.md](CREDITS.md) for image credits.
