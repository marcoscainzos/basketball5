# Court Inside

Daily basketball games built with Next.js.

## Local development

Create `.env.local` from `.env.example`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase

Run `supabase/schema.sql` in your Supabase SQL Editor.

Required env variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase may call the public key `publishable key`. The app also accepts:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md).
