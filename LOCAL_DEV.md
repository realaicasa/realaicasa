# EstateGuard Local Development Guide

To avoid exceeding Vercel's deployment thresholds and to ensure a faster iteration loop, follow these instructions to run and test EstateGuard locally.

## Prerequisite: Node.js
Ensure you have Node.js installed. You can check by running `node -v` in your terminal.

## 1. Start Initial Development
Instead of pushing to GitHub/Vercel for every small change, run the app locally:

```powershell
# Inside the project folder:
npm install
npm run dev
```

The terminal will provide a local URL (e.g., `http://localhost:5173`). Open this in your browser.

## 2. Testing Changes
1. **Live Reload**: Most changes will automatically refresh the browser when you save a file.
2. **Console Verification**: Check the browser console (F12 -> Console) to see the `[EstateGuard-v1.2.1]` logs.
3. **Supabase Connection**: The local app uses the same Supabase project context as your live site.

## 3. When to Push to GitHub/Vercel
- **Only push when a feature is complete and verified locally.**
- This significantly reduces the number of Vercel builds and keeps your deployment threshold healthy.

---

### Pro Tip: Cache Busting
If you don't see your changes on the live site after a push, remember to use **Incognito Mode** or **Empty Cache and Hard Reload** (Right-click Refresh button in Chrome DevTools) to bypass the Service Worker.
