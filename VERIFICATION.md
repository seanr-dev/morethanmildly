# Verification

Checks performed on the implementation and local database during the initial release.

| Area                       | Result                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript / Astro         | `npm run check`: zero errors and zero warnings; 14 dependency API deprecation hints                                                                                                                                               |
| Production compilation     | `npm run build`: successful Netlify SSR function generation                                                                                                                                                                       |
| Database integration tests | Five tests passed: cloud driver/parameter compatibility, input validation, notification time zones, push destination restrictions, and actual SQL migrations / data constraints                                                   |
| Search                     | Searching for `notebook` returned the matching article; an unmatched term returned the designed empty state; clearing filters restored results                                                                                    |
| Category filter            | Living returned its two launch stories; primary and secondary categories are available                                                                                                                                            |
| Most liked                 | Liking the long-way-home article persisted across reload and moved it to the first position when sorted by Most liked                                                                                                             |
| Infinite scroll            | The initial nine articles expanded to all 16 after scrolling; the end-of-results state appeared                                                                                                                                   |
| Article layout             | Title, date, categories, image alt text, body, related articles and three labelled advertisement positions rendered                                                                                                               |
| Private likes              | The UI reflects the visitor's selection and does not display a total; public serialization removes the count                                                                                                                      |
| Mobile                     | Visually inspected 390 px phone and 768 px tablet frames; tested the phone menu and category link; responsive image/text stacking confirmed. The final article layout was also checked at both sizes, with no horizontal overflow |
| Desktop accessibility      | No missing image alt attributes or unlabelled form controls on the checked journal page; visible focus treatment, semantic landmarks and labelled controls inspected                                                              |
| Themes                     | Manual dark-mode toggle worked; corresponding supplied logo rendered                                                                                                                                                              |
| Console                    | No application errors in the clean journal session; the browser's own extension reported an unrelated metadata error                                                                                                              |
| Admin entry                | Signed-out visitors saw the login form rather than the editorial workspace; all admin API routes check Identity and the admin role                                                                                                |
| SEO                        | Server-rendered content, canonical/OG metadata, Article/Organization structured data, sitemap and robots routes reviewed                                                                                                          |
| Failure handling           | Article fetch aborts, retry state, form validation/errors, loading indicators and empty states reviewed; the empty state was also exercised in the browser                                                                        |

## Account and device checks still required

- Authenticated admin CRUD and image upload need an enabled primary Netlify Identity instance and a real account with the admin role. No authentication bypass was used.
- Actual notification delivery and operating-system installation need permission on real supported HTTPS desktop/mobile devices. The scheduler's time-zone and deduplication rules passed automated tests.
- GA4 and Meta/TikTok provider-side debug checks require the owner's real identifiers and the chosen privacy configuration.
- Automatic approval review blocked the final advertising enquiry submission test because it would create a stored record. The form's presentation/validation and database schema were checked, but a complete submitted enquiry is not claimed as verified. Explicit authorization is needed to perform that test.
- These checks are not a formal WCAG or worldwide privacy-compliance certification. Business-specific legal notice details remain an owner setup item.

## Deployed environment

The Netlify publication and admin-subdomain deployments reached `ready`. All three initial migrations were applied to the production database. The publication home and paginated article API returned HTTP 200 with 16 launch stories; the admin subdomain returned HTTP 200 with the signed-out login. The manifest is served as `application/manifest+json`. Unauthenticated admin API access returns 401. Identity's settings endpoint returned 404, confirming that Identity activation remains an owner setup step.

GitHub publication is blocked by the connected integration's HTTP 403 write-permission response. The code is committed locally and provided as a source archive; no successful GitHub push is claimed.

The final release audit checked all 32 sitemap URLs successfully: HTTP 200, one page heading, matching canonical URL, Open Graph metadata and valid structured data. Every article contained its reading body and the top/middle/bottom ad positions in order; every category had its header advertisement. Production API queries verified text search, empty results, primary/secondary filters and pagination, with no like totals exposed. Missing page/category/article URLs returned 404. The service worker, offline page and public push-key endpoint returned 200.

Final publication deploy: `6a9eb8ca57f6a9d36eba7e8f`. Admin-host deploy: `6a9eb697559c85b128d25cd9`.
