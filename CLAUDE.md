# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Requires Node 22 — use fnm to activate
eval "$(fnm env)" && fnm use 22

# Package manager is Bun
bun install              # install dependencies
bun run dev              # dev server
bun run build            # production build (adapter-node)
bun run preview          # preview production build
bun run check            # svelte-kit sync + svelte-check (typecheck)
```

## Architecture

SvelteKit + Svelte 5 (runes) + TypeScript + Tailwind CSS v4 app for managing a Saltbox media server. Runs inside a Docker container and uses `nsenter` to execute host commands.

### Two-Layer API Pattern

- **`src/lib/data/api.ts`** — Mock API with artificial delays, used in dev when real services are unavailable.
- **`src/lib/server/api.ts`** — Real API that wraps server modules (`docker.ts`, `saltbox.ts`, `system.ts`, etc.) with `withFallback()`. In dev, falls back to mock data on error. In production, errors propagate.
- **`src/lib/server/`** is the only directory that touches the real system. The mock layer is the single swap point.

### Server Modules (`src/lib/server/`)

- **`docker.ts`** — Dockerode client for container listing, stats, logs, actions. Connects via `DOCKER_HOST` or `/var/run/docker.sock`.
- **`host-exec.ts`** — `nsenter -t 1` wrapper (`hostExec` for one-shot, `hostSpawn` for streaming). Sanitizes environment to prevent container env leaking to host.
- **`saltbox.ts`** — Reads `/srv/git/saltbox/accounts.yml`, scans role directories, runs `sb install/uninstall` via `hostExec`.
- **`jobs.ts`** — In-memory job tracker for long-running operations (install, update). Strips ANSI, caps at 5000 lines, auto-cleans old jobs. Polled via `/api/jobs/[id]`.
- **`validate.ts`** — `validateSlug()`, `validateContainerIdOrName()`, `clampLogCount()`. Used by all mutating API routes.
- **`audit.ts`** — JSON audit log to stdout + `/var/log/saltbox-ui/audit.log`.

### Stores (Svelte 5 Runes)

Files are `.svelte.ts` with getter/setter pattern over `$state()`:
```typescript
let searchQuery = $state('');
export function getAppsStore() {
  return {
    get searchQuery() { return searchQuery; },
    set searchQuery(v: string) { searchQuery = v; }
  };
}
```
Stores hold UI state only (filters, selection, sidebar). Data flows from server load functions, not stores.

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — health, containers, activity, storage, quick actions |
| `/apps` | App grid/list with category filter, search, install catalog |
| `/apps/[slug]` | App detail — tabs: overview, logs, config, network |
| `/docker` | Container table with log viewer drawer |
| `/storage` | Mount tree, disk usage, rclone, mergeFS config |
| `/system` | CPU/mem/disk metrics, backups, Traefik routes, services |

### API Routes (`src/routes/api/`)

All mutating routes: validate input → audit log → call `api` method → return JSON. Pattern:
```typescript
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const slug = validateSlug(params.slug);
  if (!slug) return json({ success: false, error: 'Invalid' }, { status: 400 });
  await auditLog({ user: locals.user, action: '...', target: slug });
  const result = await api.someMethod(slug);
  return json(result);
};
```

### Security (`src/hooks.server.ts`)

Request pipeline: health check bypass → auth (`remote-user` header from Authelia, skipped in dev) → CSRF origin check → body size limit (1MB) → rate limiting (sliding window per API prefix).

## Styling

- **Tailwind v4** with `@theme` directive in `src/app.css` defining oklch color tokens.
- Industrial dark theme with warm amber accents (`oklch(0.80 0.15 75)`).
- Fonts: IBM Plex Sans (sans), JetBrains Mono (mono).

### UI Component Variants

- **Button**: `default | primary | danger | ghost` — primary is amber, danger is red.
- **Badge**: `default | success | error | warning | info`
- **Card**: padding `none | sm | md | lg`

## Svelte 5 Gotchas

- No `onclick|stopPropagation` — use `onclick={(e) => { e.stopPropagation(); handler() }}`
- No `<svelte:component>` — components are dynamic by default, use `{#if}` branches
- No `<svelte:self>` — self-import the component (`import MountTree from './MountTree.svelte'`)
- `{@const}` must be direct child of block tags (`{#each}`, `{#if}`), not inside HTML elements

## Types

Defined in `src/lib/types/`:
- `common.ts` — `Status` union (`running | stopped | error | updating | installing`), `TimeRange`, `PaginatedResponse<T>`
- `app.ts` — `SaltboxApp`, `AppCatalogEntry`, `AppCategory`, `AppSource`
- `container.ts` — `Container`, `ContainerLog`, `PortMapping`
- `storage.ts` — `MountPoint`, `RcloneRemote`, `MergeFSConfig`
- `system.ts` — `SystemHealth`, `TraefikRoute`, `BackupEntry`, `ActivityEvent`, `ServiceStatus`
