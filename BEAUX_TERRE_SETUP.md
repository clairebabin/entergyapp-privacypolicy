# Beaux Terre — Field Notes signup funnel

Static landing page (`index.html`) plus a serverless signup endpoint
(`api/subscribe.js`) that, on every submission:

1. Adds the email to the monday.com **Field Notes Subscribers** board
   (board id `18431902072`, columns: Email, Signup date, Welcome sent, Status).
2. Sends an immediate welcome email from `claire@beauxterre.com` via Gmail.

The board add always happens, even if the email send fails, so every
signup is captured on monday.com.

## Deploy (Vercel)

1. Push this repo to GitHub (already done) and import it into
   [Vercel](https://vercel.com/new) — no build config needed, it auto-detects
   the static `index.html` and the `api/` serverless function.
2. In the Vercel project's **Settings → Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `GMAIL_USER` | `claire@beauxterre.com` |
   | `GMAIL_APP_PASSWORD` | App Password for that account (see below) |
   | `MONDAY_API_TOKEN` | monday.com personal API token (see below) |
   | `MONDAY_BOARD_ID` | `18431902072` (optional — this is already the default) |

3. Redeploy.

## Getting a Gmail App Password for claire@beauxterre.com

1. Sign in as `claire@beauxterre.com` at [myaccount.google.com](https://myaccount.google.com/security).
2. Turn on **2-Step Verification** if it isn't already on.
3. Go to **App Passwords**, create one named "Beaux Terre Field Notes", and
   copy the 16-character password into `GMAIL_APP_PASSWORD`.

If `claire@beauxterre.com` is a Google Workspace account, an admin may need
to enable App Passwords for the account first.

## Getting a monday.com API token

1. In monday.com, click your avatar → **Administration** (or **Developers**
   under your profile) → **API**.
2. Generate a personal API token and copy it into `MONDAY_API_TOKEN`.

## Local testing

```bash
npm install
cp .env.example .env   # fill in the values above
vercel dev              # or `npm i -g vercel` first
```

Then open `http://localhost:3000` and submit the form.
