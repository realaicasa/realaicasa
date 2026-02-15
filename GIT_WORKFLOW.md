# EstateGuard Git & Vercel Workflow Guide

This guide explains how to use a `dev` branch to keep your work organized and avoid hitting Vercel's deployment limits.

## The Concept: "Production" vs "Development"

- **`main` branch**: This is your "Production" code. Whatever is here is what your users see on the live site. Vercel is usually set up to build and deploy every time you push to `main`.
- **`dev` branch**: This is your "Workbench". You push your daily updates, experiments, and fixes here. Vercel **does not** automatically deploy this to your main site, so it doesn't count against your build limits in the same way.

---

## 1. Initial Setup (One-time)

I have already created the `dev` branch for you. To switch to it in your terminal, run:

```powershell
git checkout dev
```

## 2. Your Daily Workflow

When you are working on the project, follow these 3 steps:

### Step A: Work Locally
Run `npm run dev` and test everything at `http://localhost:3000`. Do not push anything yet.

### Step B: Save to GitHub (The `dev` branch)
When you've finished a session and want to save your progress to GitHub safely:

```powershell
git add .
git commit -m "Update: Describe your changes here"
git push origin dev
```
*Vercel will NOT deploy this to your live site, but your code is safely backed up on GitHub.*

### Step C: Go Live (Merge to `main`)
Once you have tested everything on the `dev` branch and you are ready to update the live site, "merge" the changes:

```powershell
# 1. Switch back to the production branch
git checkout main

# 2. Pull the latest work from 'dev' into 'main'
git merge dev

# 3. Push to 'main' (This triggers the Vercel build)
git push origin main
```

---

## Why do this?
1. **Safety**: If you break something in `dev`, it doesn't affect your live site.
2. **Efficiency**: You can push 50 times to `dev` in one day and it won't use up your Vercel quota.
3. **Clarity**: You only push to `main` when you are 100% sure the release is ready.
