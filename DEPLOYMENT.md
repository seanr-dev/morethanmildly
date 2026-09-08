# Deployment and operations

## Netlify projects

The primary application is `morethanmildly` (project ID `6766cc96-9750-4b60-8917-76b7d391c170`). Build from the repository root with `npm run build`, publish `dist`, Node 22. Netlify runs the SQL migrations in `netlify/database/migrations` and injects database connectivity for `@netlify/database`. Drizzle uses its native Netlify Database adapter. `src/db/client.ts` bridges the pinned Drizzle release candidate’s string-call API to Neon 1.x `.query()`, preserving parameterization and the SDK’s refreshing credentials. A regression test exercises this cloud path.

The admin address is served by `morethanmildly-admin` (project ID `d9a31e90-d937-4622-b34f-006be7aabaa3`). Its base directory is `admin-host`, publish directory `public`, with no build command. It proxies admin pages, API requests, assets and media to the primary application. Both addresses are intended to use the primary database and Identity service. Every admin API request independently verifies authentication and the `admin` role. The upstream `/admin` route also remains protected and available to avoid a proxy redirect loop. The separate host's Identity routing still needs resolution and verification; see the administrator activation notes below.

A custom domain can later replace the Netlify addresses. Update `PUBLIC_SITE_URL`, `PUBLIC_ADMIN_ORIGIN`, both redirect configurations, Identity URLs and the VAPID subject, then redeploy. The admin and publication should retain separate origins.

Both existing Netlify projects are connected to `seanr-dev/morethanmildly` through the account's Netlify GitHub App, with automatic builds active and `main` as the production branch. The repository connection preserves the existing projects, URLs, environment variables and production database. Inspect these settings in **Project configuration → Build & deploy → Continuous deployment**.

| Setting            | Publication                   | Admin host                 |
| ------------------ | ----------------------------- | -------------------------- |
| Project            | `morethanmildly`              | `morethanmildly-admin`     |
| Repository         | `seanr-dev/morethanmildly`    | `seanr-dev/morethanmildly` |
| Production branch  | `main`                        | `main`                     |
| Base directory     | Repository root (leave blank) | `admin-host`               |
| Package directory  | Leave blank                   | Leave blank                |
| Build command      | `npm run build`               | Leave blank                |
| Publish directory  | `dist`                        | `public`                   |
| Configuration file | `netlify.toml`                | `admin-host/netlify.toml`  |

The admin base directory makes Netlify select `admin-host/netlify.toml` and resolve `public` to `admin-host/public`. A separate package directory is unnecessary because the configuration lives in the base directory. Both paths were checked with Netlify's configuration resolver. See [Netlify's build configuration documentation](https://docs.netlify.com/build/configure-builds/overview/) for directory settings.

Continuous deployment was verified with commit `c67f4e68db9391f7cffec578eb64bf3e8b875d9e`: GitHub triggered production builds for both projects, and both reached `ready` with that exact commit SHA. Changes confined to the publication do not need to rebuild the static admin proxy. Deployment evidence is recorded in [VERIFICATION.md](VERIFICATION.md).

The publication's production URL is public. Netlify team-login protection is limited to its non-production deploys, so previews remain protected while readers and crawlers can access the published site. Editorial API authentication remains enforced by the application.

## GitHub sync status

GitHub write access was restored on 7 September 2026. The complete 85-file application was published to `main` in commit `e51e9a822a7256d20d7c994705ffa254bd683339`. Its Git tree, `16b53e5d22a5d72cb16b470385fc4c8479b40065`, exactly matches the verified release source. The original local development history is preserved on `local/pre-github-sync`; the working `main` branch tracks GitHub.

Netlify CLI authorization was approved on 7 September 2026, and both existing projects were linked to this repository on `main`. Netlify confirmed the repository URL, GitHub provider, production branch and active automatic builds for each project. Authorization is stored in the CLI's standard credential store; no access token is included in source.

## Activate the first administrator

1. In the **primary** Netlify project, open **Identity → Enable Identity**.
2. Set registration to **invite only**. The UI offers no public signup, but this service setting must also be set.
3. Set the Identity site URL to `https://morethanmildly-admin.netlify.app/admin` and include that address in permitted redirect URLs if the dashboard exposes that setting.
4. Invite the intended administrator's email, then assign `admin` under the user's roles/app metadata. Do not put roles in editable user metadata.
5. Open the invitation link, choose a password, and sign in at the admin address.
6. Create a draft, upload an image, publish, edit and delete a temporary article to verify the account and Blobs permissions.

No credentials or administrator account have been invented. Identity activation and a real administrator email are necessary for the first authenticated end-to-end session. Documentation: [Netlify Identity setup](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/get-started/).

The configuration resolver reports that the admin host's `/.netlify/identity/*` proxy rule uses a reserved source path. This routing issue must be resolved before treating separate-host login as ready; enabling Identity alone does not verify it. The protected primary `/admin` address is available for primary-origin authentication checks.

## Environment variables

Set values in Netlify, never in Git. Use build and function/runtime scopes for `PUBLIC_*` values because browser bundles embed them during the build. Rebuild after changing them.

| Variable                   | Purpose                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`          | Canonical publication origin                                                                              |
| `PUBLIC_ADMIN_ORIGIN`      | Exact trusted admin origin                                                                                |
| `VISITOR_SECRET`           | Random server-only secret of at least 32 characters for signed visitor cookies and hashed rate-limit keys |
| `PUBLIC_VAPID_PUBLIC_KEY`  | Public Web Push key                                                                                       |
| `VAPID_PRIVATE_KEY`        | Matching server-only Web Push key                                                                         |
| `VAPID_SUBJECT`            | Public HTTPS contact/about URL or appropriate mailto contact                                              |
| `PUSH_JOB_SECRET`          | Random server-only secret protecting the background notification job                                      |
| `PUBLIC_GA_MEASUREMENT_ID` | Your GA4 `G-…` identifier                                                                                 |
| `PUBLIC_META_PIXEL_ID`     | Your Meta Pixel identifier                                                                                |
| `PUBLIC_TIKTOK_PIXEL_ID`   | Your TikTok Pixel identifier                                                                              |
| `PUBLIC_MARKETING_ENABLED` | `false` by default; enable only when the audience and advertising privacy setup permit it                 |

The initial Netlify configuration includes origins and generated server/push secrets. Analytics and pixel identifiers were not supplied. Do not rotate VAPID keys casually: existing subscriptions must be renewed if the application-server key changes. Local `.env` is ignored by Git.

## Privacy and analytics launch work

Optional analytics and marketing scripts load only after the relevant consent. Marketing stays off under Global Privacy Control, including if a previously saved preference allowed it. Visitors can reject optional cookies, choose categories, withdraw permission, and submit a privacy request. Consent expires after 400 days. Raw search terms and enquiry form contents are not sent to analytics.

GA4 events include page views, article views, reading milestones, filters, likes, shares, visible ad impressions, ad clicks, enquiries, installation and notification preferences. Test with your actual IDs in the providers' debug tools after opt-in, and verify no provider requests after rejection.

Before running advertising, supply the business's legal controller name, address/contact, actual processors, transfer safeguards and retention schedule in `src/pages/privacy.astro` and `src/pages/cookies.astro`. Review jurisdiction and age-related requirements for this all-ages audience, including whether a certified consent platform is required by your eventual ad network. This implementation provides consent controls and notices; it is not a certification of worldwide legal compliance.

## Push notifications

A scheduled function invokes an authenticated background function every 15 minutes. The dispatcher uses each subscriber's IANA time zone, including daylight saving and quarter-hour offsets, and unique database claims for morning/afternoon/evening. It sends a recent published article, avoiding a repeat where possible. Subscriptions that return 404/410 are removed. Delivery records older than 30 days and expired rate-limit records are pruned.

To prevent duplicate notifications, each period is claimed before sending and failed/ambiguous delivery attempts are not automatically retried that period. Browser/OS permission, focus modes, network availability and push-service delivery affect exact arrival time. Empty publications generate no push. Large subscriber volumes may need a queue beyond the current paginated dispatcher and Netlify execution limits.

On iPhone/iPad, installation to the home screen is required for Web Push support. Other supported browsers can allow push without installation. The app offers explicit opt-in and unsubscribe controls. Confirm a real subscription on an HTTPS desktop browser and an installed iOS/Android device; unit tests cannot prove external push delivery.

## Editorial and advertising operations

The launch migration adds 16 original reflective essays with no invented research claims. Edit, replace or unpublish them through the portal. The initial primary/secondary categories match the brief. Referenced categories cannot be removed until their articles are reassigned. An article must have a valid primary category. Inline media is limited to three images.

Use Advertising to activate a creative for the category header, article header, article middle or article footer. Unfilled inventory links to the enquiry page. The application records enquiries in the portal; it does not run a sales inbox, negotiate prices or process payments.

Image uploads are validated and stored in Netlify Blobs. Article deletion removes likes through a database cascade; it does not delete potentially shared image objects. Periodically review unused media and enquiries under your documented retention policy. Do not delete data without verifying retention and backup needs.

## Migrations and releases

```sh
npm ci
npm run check
npm test
npm run build
```

Change `src/db/schema.ts`, then `npm run db:generate` and review the generated SQL. Keep new migrations in the Netlify numbered-directory format. Add new migrations instead of rewriting any migration that has run. The manual editorial-constraints migration contains triggers/checks beyond the generated snapshot; preserve them when evolving the schema. `scripts/create-launch-migration.ts` is an initial seed authoring script, not an ongoing content deployment mechanism.

Use Netlify deploy previews for future changes. Keep preview database/Blobs data isolated from production. The preview media store is deploy-scoped. Identity roles are checked on every operation; there is no unauthenticated seed endpoint or admin bypass.

The service worker caches only the offline shell and brand assets. Admin pages, API responses, Identity traffic and article bodies are excluded from offline caches. SEO pages are server-rendered; sitemap contents reflect the database, including only published articles.
