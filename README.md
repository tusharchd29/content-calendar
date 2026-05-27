# Content Calendar

A Next.js app for managing social media content calendars, with Google Sheets as the data store. Deployable on Vercel in minutes.

## Architecture

- **Frontend**: Next.js (React) — same UI as the original Apps Script version
- **Backend**: Next.js API routes replace Google Apps Script
- **Data**: Google Sheets (via Service Account + Sheets API v4)
- **Auth**: PIN-based (PM PIN / Posting Team PIN)

---

## Setup Guide

### Step 1 — Create your Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Copy the **Spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`
3. The app will auto-create the required sheets (`Posts`, `Clients`, `Activity Log`) on first use

---

### Step 2 — Create a Google Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Sheets API**:  
   APIs & Services → Library → search "Google Sheets API" → Enable
4. Create a Service Account:  
   APIs & Services → Credentials → Create Credentials → Service Account
   - Name it anything (e.g. `content-calendar-sa`)
   - No roles needed
5. Click the service account → **Keys** tab → **Add Key** → JSON
6. Download the JSON key file
7. **Share your Google Sheet** with the service account email (the `client_email` from the JSON, e.g. `content-calendar-sa@your-project.iam.gserviceaccount.com`) — give it **Editor** access

---

### Step 3 — Local development

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/content-calendar.git
cd content-calendar
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your values (see below)

npm run dev
# Open http://localhost:3000
```

**`.env.local` values:**

```
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # paste the entire JSON as one line
SPREADSHEET_ID=your_spreadsheet_id_here
PM_PIN=1234
POSTING_PIN=5678
```

> Tip: To minify the JSON to one line, run:  
> `cat service-account-key.json | python3 -m json.tool --compact`

---

### Step 4 — Deploy to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. In **Environment Variables**, add:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the entire JSON as one line
   - `SPREADSHEET_ID` — your sheet ID
   - `PM_PIN` — e.g. `1234`
   - `POSTING_PIN` — e.g. `5678`
4. Deploy — done ✅

---

## Roles & PINs

| Role | Default PIN | Access |
|------|------------|--------|
| Project Manager | `1234` | Create/edit/delete posts, manage clients |
| Posting Team | `5678` | View posts, mark platforms as posted |

Change PINs via environment variables — no code changes needed.

---

## Google Sheets structure

The app manages three sheets automatically:

- **Posts** — one row per post, columns for all platform statuses
- **Clients** — client names + their active platforms
- **Activity Log** — timestamped audit trail of all actions

---

## Project structure

```
content-calendar/
├── lib/
│   └── sheets.js          # All Google Sheets API calls
├── pages/
│   ├── index.js           # Full React frontend
│   └── api/
│       ├── verify-pin.js  # POST /api/verify-pin
│       ├── clients.js     # GET/POST /api/clients
│       ├── posts.js       # GET/POST/PUT/DELETE /api/posts
│       └── mark-posted.js # POST /api/mark-posted
├── .env.local.example
├── next.config.js
└── package.json
```
