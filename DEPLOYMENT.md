# Court Inside deployment

## 1. Supabase

Run `supabase/schema.sql` in Supabase SQL Editor.

Local `.env.local`:

```env
BALLDONTLIE_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Do not include `/rest/v1/` in `NEXT_PUBLIC_SUPABASE_URL`.

## 2. Vercel without custom domain

Import the GitHub repository in Vercel. Vercel will give a temporary URL like:

```text
https://your-project.vercel.app
```

In Vercel Project Settings → Environment Variables, add:

```env
BALLDONTLIE_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Apply them to Production and Preview.

## 3. Supabase Auth URLs

In Supabase Authentication → URL Configuration:

```text
Site URL = https://your-project.vercel.app
Redirect URLs = https://your-project.vercel.app/*
```

When you buy a domain, replace those with:

```text
Site URL = https://yourdomain.com
Redirect URLs = https://yourdomain.com/*
```

## 4. Before production

- Configure custom SMTP/Resend before enabling email confirmations seriously.
- Keep `service_role`, JWT secret and database password out of frontend env variables.
- Use only anon/public/publishable key in `NEXT_PUBLIC_*`.
