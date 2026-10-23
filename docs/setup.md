# Setup & Deployment Guide: FixMyCity

## 1. Quick Local Development (Prototype Mode)

FixMyCity is built with a resilient dual-mode data service. You can run and evaluate the complete full-stack prototype immediately without configuring third-party accounts or cloud API keys:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run test suite to verify 23 test suites
npm test

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000`. The platform will automatically load seeded municipal departments, ward offices, and realistic complaints centered around the Pune Municipal Corporation area.

---

## 2. Supabase Cloud Integration (Production Mode)

To connect FixMyCity to a live Supabase PostgreSQL database:

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Under **Project Settings -> API**, copy your **Project URL** and **anon public key**.

### Step 2: Configure Environment Variables
Create a file named `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
CRON_SECRET=your-secure-cron-secret-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Database Migrations
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Open and run `supabase/migrations/20261023000000_init_fixmycity.sql`.
3. Open and run `supabase/seed.sql` to populate initial municipal data and priority policies.

### Step 4: Configure Storage Bucket
1. Go to **Storage -> Create Bucket**.
2. Name the bucket `complaint-attachments`.
3. Set public access or configure authenticated RLS access as desired.

---

## 3. Scheduling the Automated Escalation Cron Job

The escalation engine runs via `POST /api/cron/escalate` and requires the `CRON_SECRET` bearer token.

### Option A: Local / Manual Execution
During presentations or testing, click **"Run Auto-Escalation Job"** in the Admin Command Center (`/admin`), or run:
```bash
curl -X POST http://localhost:3000/api/cron/escalate \
  -H "Authorization: Bearer prototype-cron-secret-2026"
```

### Option B: Production Vercel Cron
Add a `vercel.json` file in the project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/escalate",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option C: Linux Crontab (Hourly scan)
```bash
0 * * * * curl -s -X POST https://your-deployment-domain.com/api/cron/escalate -H "Authorization: Bearer YOUR_CRON_SECRET" > /dev/null
```
