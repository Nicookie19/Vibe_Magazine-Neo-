# Project audit — 2026-11-01

## Verification

- `npm run lint`: passes, with no errors or warnings.
- `npm run test:run`: 15 files and 83 tests pass.
- `npm run test:ui -- --run --no-open --api.port 51213`: UI starts and all 83 tests pass after installing the missing matching `@vitest/ui` dependency.
- `npm run build`: passes. Existing non-blocking warnings concern the Browserslist dataset, redundant Tailwind line-clamp plugin, and large application bundle.
- Chromium checks against the built app (`vite preview`): 24 public-route checks and 14 admin-tab checks, at 390px and 1440px viewport widths. All render content, with no recorded runtime errors or document-level horizontal overflow.
- Two-page PDF fixture renders both pages through the bundled PDF.js worker at both viewport widths.
- Browser backend responses and staff sessions were mocked. Admin screens were tested primarily with empty datasets; these checks do not exercise every mutation or modal. Mobile upload and home screenshots were inspected visually.

Public routes checked: `/`, `/archive`, `/about`, `/contact`, `/submit`, `/vibelogin`, `/reset-password`, `/confirm-signup`, `/notification`, `/access-denied`, `/admin` as a guest, and `/magazine/missing`.

Admin tabs checked: upload, analytics, feedback, comments, library, submissions, and users. No live accounts, submissions, files, passwords, or database records were changed during verification.

## Repairs completed during the audit

- Included JavaScript test files that the Vitest include pattern previously skipped.
- Added regression tests for active staff access, inactive/non-staff denial, sign-out, invalid confirmation links, direct magazine links, and submission acceptance independent of email delivery.
- Verified staff role and activation before rendering the dashboard; removed the login redirect based only on stale local storage.
- Corrected login URLs and false success messages for invalid confirmation links.
- Guarded reader subscriptions before a magazine exists, preventing direct-link crashes.
- Removed unused archive PDF imports and the invalid production worker path. The active reader and uploader retain their bundled worker.
- Fixed mobile upload columns and removed viewport clipping.
- Corrected the realtime feedback event field and stabilized fetch dependencies.
- Removed disconnected demo timers, unused handlers, and lint configuration false positives.
- Removed hard-coded account credentials from `createUser.js`; documented its environment inputs.
- Added inactive-account checks to account-management Edge Functions and prevented admins from resetting superadmin passwords.
- Removed simulated email success. The mail endpoint explicitly reports that delivery is unconfigured. Acceptance still publishes and reports undelivered email separately.

## Remaining live-system verification

1. Deploy and exercise the updated Edge Functions in a test Supabase project before production. Local lint does not validate hosted execution or deployed versions.
2. Verify RLS policies, migrations, storage buckets, realtime publication settings, and RPC functions with real test accounts. Client-side route checks do not replace backend authorization.
3. Verify real password login, Google OAuth, recovery and confirmation callbacks with the deployed redirect URLs.
4. Exercise file uploads, publication, deletion, comments, ratings, and user management end-to-end against a test backend. The browser PDF fixture verifies rendering, not storage permissions or large-document performance.
5. Implement and authenticate a real email-provider integration. `send-notification` currently returns HTTP 501 / `not_configured`; supplying an API key alone does not enable delivery.
6. Firebase deployment scripts still require a Firebase CLI, project, and hosting configuration. No deployment was performed.
7. Use Node 22.13+ (or Node 24+) to satisfy the installed PDF.js engine requirement. These checks passed on the current Node 20.20.2 environment, but npm reports that runtime as unsupported.
8. If the old hard-coded account password was ever used, replace it through the account's normal password-reset process.

The checked local and built-app paths pass. This is not a claim that every live integration or every possible input has been verified.
