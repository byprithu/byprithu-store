# byprithu Poster Store — Deployment Guide

Your permanent link will be: https://byprithu-store.vercel.app
(or a custom domain like https://order.byprithu.in)

---

## Deploy in 5 minutes (free, permanent link, never changes)

### Step 1 — Upload to GitHub

1. Go to https://github.com and sign in (or create a free account)
2. Click the green "New" button → name it `byprithu-store` → click "Create repository"
3. On your computer, open the folder you downloaded (byprithu-store/)
4. Drag all the files into the GitHub page — it will ask you to commit, click "Commit changes"

### Step 2 — Deploy on Vercel

1. Go to https://vercel.com → sign in with your GitHub account
2. Click "Add New Project"
3. Find and select `byprithu-store` from your GitHub repos
4. Click "Deploy" — Vercel auto-detects Next.js, no config needed
5. Wait ~60 seconds → your live URL appears!

Your link will be something like:
  https://byprithu-store.vercel.app

---

## Update the site later (link NEVER changes)

Whenever you want to update (add posters, change prices, new features):

1. Edit the files on GitHub directly (click the file → pencil icon → edit → commit)
2. Vercel auto-deploys within 60 seconds
3. Your link stays exactly the same — byprithu-store.vercel.app

---

## Custom domain (optional — like order.byprithu.in)

1. In Vercel dashboard → your project → Settings → Domains
2. Add your domain (e.g. order.byprithu.in)
3. Follow the DNS instructions (takes 5–10 mins)
4. Done — your permanent branded link is ready

---

## How orders are stored

Orders are saved in the customer's browser (localStorage) and written
to a shared key so your seller dashboard can read them.

For a production setup with a real database (so orders survive across
devices), consider adding a free Supabase or PlanetScale database —
let Prithu know and we can add that too.

---

## Files in this project

src/app/page.js      — the entire app (seller dashboard + customer form)
src/app/layout.js    — page title and base styles
package.json         — dependencies
next.config.js       — Next.js config
README.md            — this file
