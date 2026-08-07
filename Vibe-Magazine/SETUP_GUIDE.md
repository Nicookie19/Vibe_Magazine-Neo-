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

## 6. Start the app

From the project root:

```bash
npm run dev
```

Vite prints a local address, normally `http://localhost:5173/`. Open that address in your browser. Keep this terminal running while developing.

Useful commands:

```bash
npm run build    # Creates an optimized production build in dist/
npm run preview  # Serves the already-built dist/ folder locally
npm run lint     # Checks the source with ESLint
```

To stop the development server, focus its terminal and press `Ctrl+C` on Windows or `Control+C` on macOS.

## 7. Optional: deploy Supabase Edge Functions

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

The first three use Supabase-managed values such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the hosted function environment. `send-notification` additionally needs an email service key. Set only the provider you use:

```bash
npx supabase secrets set RESEND_API_KEY=your_resend_key
# or
npx supabase secrets set SENDGRID_API_KEY=your_sendgrid_key
```

Never expose any of these values in frontend code or a `VITE_` variable.

## 8. Optional: Firebase deployment

The `package.json` file includes Firebase deploy scripts. They require a Firebase project and Firebase hosting configuration (`firebase.json` and `.firebaserc`), which are not currently committed in this repository. Do not run these scripts until that configuration exists.

Once configured:

```bash
npm install --global firebase-tools
firebase login
npm run deploy:hosting
```

## 9. Common problems

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

## 10. Before sharing code or asking for help

Run this quick check:

```bash
git status
npm run build
```

Share the terminal error and the first browser-console error if something fails. Do not share `.env` contents, access tokens, API keys, or passwords.
