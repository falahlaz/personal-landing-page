# Al Falah Lazuardi — Personal Landing Page

Static site (HTML + CSS + JS) deployed as a **Cloudflare Worker with static assets** —
no build step, no Worker script. GSAP, Lenis and the fonts are self-hosted under
`public/assets/` (no third-party requests); the hero shader is plain WebGL.

```
public/              ← everything in here is uploaded and served
  index.html
  404.html           ← served for unknown paths (not_found_handling: 404-page)
  _headers           ← security + cache headers (not publicly served)
  favicon.svg
  robots.txt
  assets/css/aurora.css
  assets/js/aurora.js
  assets/vendor/       ← gsap, ScrollTrigger, lenis (version in file name, cached immutable)
  assets/fonts/        ← Syne, Manrope, Instrument Serif woff2 (Fontsource, latin subset)
wrangler.jsonc       ← Worker config (assets-only)
```

## Local development

```bash
npm install
npm run dev          # http://localhost:8787, served by the real Workers runtime
```

## Deploy

### Option A — from your machine

```bash
npx wrangler login   # once
npm run deploy       # → https://personal-landing-page.<your-subdomain>.workers.dev
```

### Option B — auto-deploy from GitHub (Workers Builds)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Pick `falahlaz/personal-landing-page` and the production branch.
3. Build settings:
   - **Build command:** *(leave empty)*
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `/`
4. Save and deploy. Every push to the production branch redeploys; other branches get preview URLs.

The Worker name in the dashboard must match `"name"` in `wrangler.jsonc` (`personal-landing-page`).

### Custom domain

Worker → **Settings** → **Domains & Routes** → **Add** → *Custom domain*
(the domain's DNS must be managed by Cloudflare).

## Validate without deploying

```bash
npm run check        # wrangler deploy --dry-run
```

## Updating vendored libraries

Files in `assets/vendor/` and `assets/fonts/` are served with a one-year immutable cache,
so a new version must get a **new file name** (e.g. `gsap-3.16.0.min.js`) and the
`<script>`/`@font-face` references updated to match.
