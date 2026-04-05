# CMRIT Vault - Web Frontend

Next.js App Router frontend for CMRIT Vault.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:smoke
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (for API base URL and auth integration).

3. Start dev server:

```bash
npm run dev
```

## Smoke Tests

Smoke tests use Playwright and cover critical web journeys:

- Auth route reachability
- Student browsing/search/download surfaces
- Faculty and admin workspace route reachability

Run:

```bash
npm run test:smoke
```

## Notes

- App uses server-side route guards for role-based surfaces.
- UI follows shared design tokens and API-first feature modules.
