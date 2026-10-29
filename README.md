# Standard Essentials

A React 18 + Vite storefront UI for browsing products, managing a cart and wishlist, leaving reviews, and exploring customer/admin flows.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run dev
```

Create a production build with `npm run build`; preview it locally with `npm run preview`.

## Netlify deployment

The repository includes `netlify.toml`, which sets the build command to `npm ci && npm run build`, publishes the `dist` directory, and rewrites app routes to `index.html` for the React single-page app. Connect the repository to Netlify and use the repository root as the base directory. No separate publish directory or build command is needed in the Netlify UI when the checked-in configuration is honored.

The Vite base path is `/` so built assets load from the Netlify site root. GitHub Actions runs `npm ci` and `npm run build` on pushes to `main` and pull requests as a deployment-independent build check. Netlify remains the production host.

## Current application scope and security

This is a frontend-only demo. Cart, wishlist, reviews, order samples, and catalog changes are stored in the browser's `localStorage`; they are not shared across devices or backed by a database. Customer login is not real account authentication, and the current admin flow must not be used to protect real data or privileged operations. A production commerce launch requires a trusted backend, server-side authorization, persistent database, validated order totals/inventory, and a payment provider integration. Never place secrets or payment credentials in this frontend.
