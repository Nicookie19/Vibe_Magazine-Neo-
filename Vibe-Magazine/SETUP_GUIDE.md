# Vibe Magazine — Setup Guide for macOS and Windows

This guide sets up the Vibe Magazine React/Vite app for local development. It also explains the Supabase services required for login, magazines, PDF uploads, events, submissions, and admin tools.

> Do not commit `.env` files, Supabase service-role keys, or email-provider keys. The browser app only needs the public Supabase URL and anon key.

## 1. What you need to install

Install these on **either macOS or Windows** before opening the project:

| Tool | Required? | Why it is needed |
| --- | --- | --- |
| [Git](https://git-scm.com/downloads) | Yes | Clones the repository and lets you save/push changes. |
| [Node.js 20 LTS or newer](https://nodejs.org/) | Yes | Provides Node.js and `npm`, which run Vite and install every JavaScript library. |
| [Visual Studio Code](https://code.visualstudio.com/) | Recommended | Code editor used for the project. |
| Chrome, Edge, or Firefox | Yes | Tests the local website. Chrome/Edge DevTools are especially useful. |
| A Supabase account/project | Yes for real data and login | Provides the database, authentication, file storage, and Edge Functions. |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Recommended | Applies migrations and deploys Edge Functions. It can be run with `npx` if you do not install it globally. |
| Docker Desktop | Optional | Needed only to run Supabase locally with `supabase start`. Not needed with the hosted Supabase project. |
| Firebase CLI | Optional | Needed only for the `npm run deploy` / `npm run deploy:hosting` scripts. Firebase hosting configuration is not currently included in this repository. |

All JavaScript libraries used by the app (React, Vite, Tailwind, Supabase, PDF.js, page flipping, charts, etc.) are already listed in `package.json`. **Do not install them one by one**—`npm install` installs the exact versions recorded in `package-lock.json`.

### macOS quick install

1. Install the current Node.js LTS `.pkg` from [nodejs.org](https://nodejs.org/).
2. Install Git and VS Code from their official download pages. Git is often already available after installing Xcode Command Line Tools.
3. Open **Terminal**, then verify the installation:

```bash
node --version
npm --version
git --version
```

If `git` is missing, run `xcode-select --install`, complete the Apple prompt, then open a new Terminal window.

### Windows quick install

1. Install the current Node.js LTS **Windows Installer (.msi)** from [nodejs.org](https://nodejs.org/). Keep the “Add to PATH” option selected.
2. Install **Git for Windows** and **Visual Studio Code** from their official download pages. During Git setup, allow Git to be used from the command line.
3. Open a new **PowerShell** window and verify:

```powershell
node --version
npm --version
git --version
```

If a command is “not recognized,” close and reopen PowerShell after the installer has finished. This reloads your PATH.

> **Note on Node.js version:** This project uses React 19 and Vite 7, which require Node.js 18+. Node.js 20 LTS or newer is recommended.

## 2. Recommended VS Code extensions

Open VS Code, select the Extensions icon, and install:

| Extension | Required? | Use |
| --- | --- | --- |
| ESLint (`dbaeumer.vscode-eslint`) | Recommended | Shows JavaScript/React lint problems in the editor. |
| Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`) | Recommended | Autocomplete and previews for Tailwind classes. |
| Prettier – Code formatter (`esbenp.prettier-vscode`) | Optional | Formats Markdown, JavaScript, and JSX consistently. |
| GitLens (`eamodio.gitlens`) | Optional | Helpful Git history/blame tools. |
| Supabase (`supabase.supabase`) | Optional | Helpful SQL and Supabase project support. |

The project does not require an extension to run. Extensions only improve the editing experience.

## 3. Get the code

In Terminal (macOS) or PowerShell (Windows), run:

```bash
git clone git@github.com:Nicookie19/Vibe_Magazine-Neo-.git
cd Vibe_Magazine-Neo-
npm install
code .
```

If SSH GitHub authentication is not configured, clone with HTTPS instead:

```bash
git clone https://github.com/Nicookie19/Vibe_Magazine-Neo-.git
cd Vibe_Magazine-Neo-
npm install
code .
```

`npm install` may take a few minutes on the first run. It creates the `node_modules` folder, which is intentionally not committed to Git.

## 4. Create the local environment file

In the project root, create a file named `.env`. The root `.env` file is ignored by Git and must stay private.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Find these two values in the Supabase Dashboard:

1. Open the project.
2. Go to **Project Settings** → **API**.
3. Copy the **Project URL** and the public/anon key.

Restart the Vite server whenever `.env` changes. Vite only reads environment variables when it starts.

Never put `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `SENDGRID_API_KEY` in this `.env` file. Variables starting with `VITE_` are sent to the browser.

## 5. Connect Supabase

The app depends on Supabase for more than just file uploads. A brand-new, empty Supabase project will not work until it has the project schema, storage buckets, authentication settings, and RLS policies.

### Required database tables

The existing Supabase project must contain at least these app tables:

- `user_profiles` — includes the authenticated user `id` and a `role` such as `admin` or `superadmin`.
- `magazines` — includes `title`, `subtitle`, `cover`, `pages`, `pdfurl`, `published`, `editor`, and `created_at`.
- `events`, `submissions`, `feedback`.
- `magazine_ratings`, `magazine_analytics`, `magazine_likes`, `magazine_saves`, and `magazine_comments` for reader features.

This repository contains access-policy migrations in [`supabase/migrations`](supabase/migrations), but it does **not** contain a complete “create every table from scratch” schema migration. For a new project, first export/import the schema from the existing working Supabase project, then apply this repository’s migrations.

### Apply the included migrations

Install/login to the Supabase CLI, link the local folder to the correct project, then push the migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Alternatively, open **Supabase Dashboard → SQL Editor** and run each migration file in date order. The most important current files are:

1. `20260727000000_allow_staff_submission_status_updates.sql`
2. `20260727000100_allow_staff_event_management.sql`
3. `20260727000200_allow_public_event_reading.sql`
4. `20260728000300_allow_pdf_magazine_uploads.sql`

The last migration adds the `magazines.pdfurl` column, configures the public `magazines` storage bucket for PDFs/images, and allows authorized staff to add magazines. Run it before testing the **Upload PDF** button.

### Required storage buckets

| Bucket | Used for | Access notes |
| --- | --- | --- |
| `magazines` | Covers, page previews, event images, and source magazine PDFs | Public read access is required so readers can display them. Staff upload access is created by the PDF migration. |
| `student-submissions` | PDFs submitted from the public submission form | Create/configure this bucket and its RLS policies in the Supabase Dashboard if it does not already exist. |

### Admin setup

Create an authentication user in Supabase, then create a matching row in `public.user_profiles` with the same UUID. Set its role to `admin` or `superadmin`. The included policies use that role to authorize event, submission, magazine, and file-management actions.

Do not rely only on browser local storage to create an admin account; that is not a security control. The database role must be set correctly.

### Enable Google Sign-In

The login page includes a **Continue with Google** option. It uses Supabase OAuth and only grants dashboard access to a Google user with an active `user_profiles` row; signing in with an arbitrary Google account is not sufficient.

1. In Google Cloud, create a **Web application** OAuth client. Add each deployed app origin (for example `https://magazine.example.com`) and `http://localhost:5173` for local development to **Authorized JavaScript origins**.
2. In the Supabase Dashboard, open **Authentication → Providers → Google**. Enable it, then paste the Google Client ID and Client Secret. Copy the Supabase callback URL shown on that page into the Google client’s **Authorized redirect URIs**. The callback must be the Supabase URL, not `/vibelogin`.
3. In **Authentication → URL Configuration**, add `http://localhost:5173/vibelogin` and the deployed equivalent (for example `https://magazine.example.com/vibelogin`) to the redirect allow list. Set the production site URL as well.
4. Create or link the intended administrator in Supabase Auth, then make sure that user’s UUID has an active `public.user_profiles` row with role `admin` or `superadmin`. Google sign-in will be denied until that profile exists.

Google requires the `openid`, email, and profile scopes for this standard sign-in flow. Keep the Client Secret in Google/Supabase settings only—never add it to a Vite environment variable.

### Create an initial staff account with the CLI

`createUser.js` reads the following server-side environment variables:

- `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` identify the backend and authorize account creation.
- `NEW_USER_EMAIL`, `NEW_USER_USERNAME`, and `NEW_USER_PASSWORD` are required; the password must contain at least eight characters.
- `NEW_USER_ROLE` is `admin` by default, or `superadmin`.
- `NEW_USER_DISPLAY_NAME` is optional and defaults to the username.

Set these in your private environment, then run `node createUser.js` only when you intend to create a real account. Never commit passwords or the service key. The audit does not execute this command against the live backend.

## 6. Start the app

From the project root:

```bash
npm run dev
```

Vite prints a local address, normally `http://localhost:5173/`. Open that address in your browser. Keep this terminal running while developing.

Useful commands:

```bash
npm run build       # Creates an optimized production build in dist/
npm run preview     # Serves the already-built dist/ folder locally
npm run lint        # Checks the source with ESLint
npm test            # Runs tests in watch mode (development)
npm run test:run    # Runs tests once (CI/CD)
npm run test:ui     # Opens Vitest UI for visual test debugging
```

To stop the development server, focus its terminal and press `Ctrl+C` on Windows or `Control+C` on macOS.

## 7. Running tests

The project includes a Vitest + React Testing Library test suite. See [`TEST_SETUP.md`](../TEST_SETUP.md) for detailed test configuration and patterns.

```bash
npm test            # Watch mode for development
npm run test:run    # Single run for CI/CD
npm run test:ui     # Visual Vitest UI
```

## 8. Optional: deploy Supabase Edge Functions

The admin tools call these hosted functions:

- `create-admin-user`
- `delete-user`
- `reset-user-password`
- `send-notification`

Deploy them after linking the project:

```bash
npx supabase functions deploy create-admin-user
npx supabase functions deploy delete-user
npx supabase functions deploy reset-user-password
npx supabase functions deploy send-notification
```

The first three use Supabase-managed values such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the hosted function environment.

The dashboard now uses manual Gmail drafts. See “Gmail decision drafts” below. The optional Resend backend remains available but is not invoked by the dashboard.

Never expose any of these values in frontend code or a `VITE_` variable.

## 9. Optional: Firebase deployment

The `package.json` file includes Firebase deploy scripts. They require a Firebase project and Firebase hosting configuration (`firebase.json` and `.firebaserc`), which are not currently committed in this repository. Do not run these scripts until that configuration exists.

Once configured:

```bash
npm install --global firebase-tools
firebase login
npm run deploy:hosting
```

## 10. Common problems

### `npm` or `node` is not recognized

Reinstall Node.js LTS with the PATH option enabled, then restart Terminal or PowerShell.

### `npm install` fails

Check that you are in the folder containing `package.json`, confirm you have an internet connection, then try:

```bash
npm cache verify
npm install
```

Do not delete `package-lock.json`; it keeps dependency versions consistent across macOS and Windows.

### Blank screen or Supabase errors

1. Check that `.env` is in the repository root, not inside `src`.
2. Confirm both variables are spelled exactly as shown above.
3. Restart `npm run dev`.
4. Open the browser console (F12 / DevTools) and check the first red error.
5. Confirm the Supabase tables, RLS policies, and storage buckets have been created.

### Events do not show to normal users

Run `20260727000200_allow_public_event_reading.sql`, then refresh the Home page.

### PDF does not upload or cannot be flipped

1. Run `20260728000300_allow_pdf_magazine_uploads.sql`.
2. Confirm the logged-in user has `admin` or `superadmin` in `user_profiles`.
3. Confirm the `magazines` bucket is public and permits staff uploads.
4. Upload the PDF, wait for the success message, then save/publish the magazine.

### A port is already in use

Start Vite on another port:

```bash
npm run dev -- --port 5174
```

## 11. Before sharing code or asking for help

Run this quick check:

```bash
git status
npm run build
```

Share the terminal error and the first browser-console error if something fails. Do not share `.env` contents, access tokens, API keys, or passwords.


## PDF uploads up to 50 MB

The submission form and admin PDF uploader accept files up to **52,428,800 bytes** (50 MB). Larger files are rejected before upload. Files above 6 MB use resumable Storage uploads in 6 MB chunks, with automatic retries and progress reporting. Keep the page open: resuming after closing or refreshing the browser is not implemented. Uploads go directly to Supabase, not through Vercel functions.

To enable this in the hosted project:

1. In Supabase **Storage settings**, set the global file size limit to 50 MB.
2. Apply `supabase/migrations/20261102000000_increase_pdf_upload_limit.sql` to set the `student-submissions` and `magazines` bucket limits to 52,428,800 bytes. It updates existing buckets without changing their access policies or accepted file types. If you previously ran the 1 GB version of this SQL, run the updated SQL again to lower the limits; existing files are not deleted.
3. Commit and push the app changes and lockfile so Vercel redeploys them.

Admin PDF uploads generate cover and page previews. Complex or many-page PDFs may still be slow on devices with limited memory.

The size boundaries and upload routing are tested using metadata-sized fixtures; no real 50 MB file was uploaded and no hosted global setting or bucket limit was changed during implementation.

References: [Supabase file limits](https://supabase.com/docs/guides/storage/uploads/file-limits), [resumable uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads).

## Internal submission screening

In **Admin Dashboard → Submissions**, click **Scan all submissions**. The scan includes all loaded submissions regardless of the status/search filters; the list is paginated when fetched. Review the expandable reports before making approval decisions.

- Flags configurable whole-word/phrase matches (English/Filipino starter list), missing metadata, and common draft placeholders.
- Extracts PDF text and compares distinct eight-word sequences across submissions. At least three shared sequences produces a review flag with matching submission IDs, page references, and an excerpt. This is not a plagiarism percentage or proof of misconduct; citations, boilerplate, and common passages can match. Paraphrasing and external sources are not detected.
- No OCR or image moderation. Image-only pages, unsupported files, failed downloads, password protection, and extraction limits are explicitly marked incomplete. Review those manually.
- Limits each PDF to 200 pages, 200,000 characters, and 60 seconds. Cancel stops the current job. Partial scans do not imply full comparison coverage.
- Runs on demand inside the admin's browser using existing access to submissions; no new service, database migration, third-party text sharing, or API key is required. Reports and customized terms last only while the panel is mounted, and are invalidated when submission metadata/files or terms change. Replacing a file at the same URL requires a rescan.
- Screening is advisory and does not modify submission status or block approval. It is not a grammar checker or a comprehensive language/context classifier.

### Scanning selected submissions

Expand **Choose submissions**, search by title/author/ID, check one or more entries, then click **Scan selected**. Only those files are downloaded and compared with each other; an individual scan explicitly reports that cross-submission overlap was not checked. **Scan all submissions** still scans the entire list, regardless of the selection. Limits protect browser memory and responsiveness; incomplete reports now identify the actual stopping page rather than incorrectly claiming 200 pages were scanned.

## Submissions reappearing after deletion

Apply `supabase/migrations/20261103000000_allow_staff_submission_deletion.sql` in the Supabase SQL Editor, then deploy the updated frontend. It grants DELETE access through an RLS policy for authenticated admins/superadmins whose profiles have `is_active = true`, regardless of submission status. It does not delete any records during setup.

The UI now requires the deleted row ID in the database response before removing a submission locally. A zero-row deletion or database error keeps the row visible and shows an error. Deleting a submission does not remove a separately published magazine or its uploaded file; manage publication removal through the Library tab. The migration has not been applied to the hosted database by this code change.

## Ratings blocked by database permissions

Run `supabase/migrations/20261104000000_allow_reader_ratings.sql` in the Supabase SQL Editor. This fixes the reader's “Ratings are currently blocked by the database permissions” message by allowing anonymous and authenticated readers to read ratings and insert ratings of 1–5 for published magazines. Row-level security stays enabled, and this migration grants no update or delete access. It supports UUID defaults and sequence-generated rating IDs.

The current site uses a browser-generated text ID stored in localStorage, not an authenticated user ID. One rating per browser is a convenience, not verified identity or abuse prevention. Existing policies are preserved; inspect any other permissive policies if tighter restrictions are needed.

No frontend change or Vercel redeployment is required for this database-only fix. After applying the SQL, retry the rating. This migration has not been applied to the hosted database by the code change.

## School email, review remarks, deadlines, and comment filtering

Apply `supabase/migrations/20261104000100_editorial_review_rules.sql` before deploying the frontend, and redeploy the `create-admin-user` Edge Function if used.

- New submission/contact emails, supplied comment emails, and new or changed account/profile emails must use exactly `@uic.edu.ph` (case insensitive). Subdomains and lookalike suffixes are rejected. Existing accounts and unchanged historical emails are retained; domain validation does not itself prove mailbox ownership. The Auth trigger also covers account creation through direct APIs and OAuth.
- Active admins and superadmins must provide rejection remarks (up to 3,000 characters); remarks are saved with the rejected status. Existing rejected submissions can receive edited remarks. Remarks are included in notification requests, but delivery requires the Resend configuration described below. Access to stored remarks follows existing submission read policies.
- “Publication due” means 72 hours after the original submission timestamp, displayed in Asia/Manila time. This is a reminder, not an automatic rejection or publication job. The database assigns submission timestamps and prevents changing them.
- New/edited comments are censored in the database, covering both `text` and `comment_text` columns. Public rendering also censors historical comment text without rewriting stored history. The filter uses whole words and common English/Filipino curses with a few spelling variants; it cannot recognize every evasion or interpret context. Human moderation remains available.

Verification includes local PostgreSQL-compatible checks for domain restrictions, permissions on reviewer remarks, timestamp integrity, and both comment schemas. Hosted migrations and Edge Function deployment are not performed by these source changes.


## Gmail decision drafts

After accepting or rejecting a submission, click **Open Gmail draft** in its row. Gmail opens in a new tab with the saved recipient, subject, decision, and rejection remarks filled in. Choose your school Gmail account, review the draft, and click **Send**. The website does not send the email or track whether you sent it. Reopening the link opens another compose window.

No API key, app password, new database migration, or Edge Function deployment is required for this manual workflow. Deploy the updated frontend. Existing database migrations for saved rejection remarks remain necessary.

## Optional Resend backend (not used by the dashboard)

The optional server sender uses the saved submission recipient and decision. Rejection emails include saved reviewer remarks. Only authenticated, active admins/superadmins can invoke the sender. The browser cannot supply arbitrary recipients, subjects, or message bodies.

### Production setup

1. In [Resend](https://resend.com/docs/dashboard/domains/introduction), add and verify a sender domain you control using its required DNS records. Sending from `@uic.edu.ph` requires permission to manage the school's DNS; the sender may use a different verified domain while recipients remain UIC addresses. A Vercel subdomain does not give you control of its email DNS. Resend's test sender is not sufficient for emailing arbitrary student recipients.
2. Create a Resend sending API key. In **Supabase → Edge Functions → Secrets**, set:
   - `RESEND_API_KEY`: the server-side Resend key.
   - `NOTIFICATION_FROM_EMAIL`: for example `Vibe Magazine <notifications@your-verified-domain.com>`.
   Do not put these in Vite variables, Git, or client code. Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the deployed function.
3. Run `supabase/migrations/20261104000200_submission_email_receipts.sql` in the project's SQL Editor.
4. Deploy the function:
   ```sh
   npx supabase functions deploy send-notification --project-ref rthdgwflkehqkjsnmbiu
   ```
   Authenticate the Supabase CLI first if necessary. Keep JWT verification enabled.
5. To adopt automatic email later, reconnect the frontend to the function; the current dashboard intentionally opens manual Gmail drafts. Test with your own UIC mailbox and check the Resend dashboard before enabling automated delivery.

“Email queued for delivery” means Resend accepted the request, not guaranteed inbox delivery. Bounces and delivery events must be inspected in Resend; delivery webhooks are not configured. Mailbox policies and spam filtering can affect delivery.

Successful provider responses are recorded in a private receipts table. The same submission/message is not resent when retried; changed remarks produce a new message. Resend's idempotency key also protects simultaneous requests and retries for 24 hours. If the provider accepted a message but the receipt could not be saved, check provider logs before retrying after that period. A server timeout can also leave delivery uncertain. The UI reports configuration/provider errors and keeps the saved submission decision.

This integration covers submission decision emails. Supabase Auth confirmation and password-reset emails use Supabase's separate Auth SMTP configuration.

Validation: mocked-provider tests cover authorization, saved recipients, acceptance/rejection templates, remarks, stale decisions, unavailable configuration, duplicate prevention, provider rejection, timeouts, and receipt failure. No real emails were sent and no hosted secrets/function deployment were changed during implementation.

Provider reference: [Send Email API](https://resend.com/docs/api-reference/emails/send-email), [24-hour idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).
