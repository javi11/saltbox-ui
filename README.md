# Saltbox UI

A web dashboard for [Saltbox](https://docs.saltbox.dev) server management. Monitor Docker containers, system health, storage mounts, Traefik routes, and installed apps from a single interface.

## Features

- **Dashboard** — CPU, memory, disk, network stats with service health checks
- **Apps** — Browse installed Saltbox apps, view details, search the install catalog
- **Docker** — Container list with status, actions (start/stop/restart), and live log viewer
- **Storage** — Mount tree, disk usage, rclone remote status, MergerFS configuration
- **System** — Detailed metrics, backup status, Traefik routes, service health

## Stack

- [SvelteKit](https://svelte.dev) + [Svelte 5](https://svelte.dev/docs/svelte) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Lucide](https://lucide.dev) icons
- [adapter-node](https://svelte.dev/docs/kit/adapter-node) for server deployment
- [Dockerode](https://github.com/apocas/dockerode) for Docker API access

## Getting Started

### Prerequisites

- Node 22+ (a `.node-version` file is included for [fnm](https://github.com/Schniz/fnm))
- [Bun](https://bun.sh) package manager

### Development

```bash
bun install
bun run dev
```

### Production Build

```bash
bun run build
node build/index.js
```

## Docker Deployment

The recommended way to run Saltbox UI on your Saltbox server.

### Docker Image

Pre-built images are published to the GitHub Container Registry (GHCR):

| Image | Updated on | Use for |
|-------|-----------|---------|
| `ghcr.io/javi11/saltbox-ui:latest` | Every release | Stable production use |
| `ghcr.io/javi11/saltbox-ui:dev` | Every push to `main` | Latest development builds |

### Quick Start

```bash
# Set your domain (and optionally the channel — defaults to 'latest')
echo "DOMAIN=yourdomain.com" > .env

# Pull and start the latest stable image
docker compose up -d

# Or use the dev image:
# echo "CHANNEL=dev" >> .env && docker compose up -d
```

### What It Mounts

The container needs read-only access to host resources:

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `/var/run/docker.sock` | `/var/run/docker.sock` | Docker API |
| `/proc` | `/host/proc` | CPU, memory, network stats |
| `/sys` | `/host/sys` | CPU temperature |
| `/etc/fstab` | `/host/fstab` | MergerFS configuration |
| `/srv/git/saltbox` | `/srv/git/saltbox` | Saltbox configs and roles |
| `/opt/saltbox_backup` | `/opt/saltbox_backup` | Backup logs |
| `/opt/sandbox` | `/opt/sandbox` | Sandbox roles |

### Traefik Integration

The `docker-compose.yml` includes standard Saltbox Traefik labels. The UI will be available at `https://saltbox-ui.yourdomain.com` with Authelia authentication.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `ORIGIN` | — | Full URL for CORS |
| `TRAEFIK_API_URL` | `http://localhost:8080` | Traefik API endpoint |
| `HOST_PROC` | `/proc` | Host proc mount path |
| `HOST_SYS` | `/sys` | Host sys mount path |
| `HOST_FSTAB` | `/etc/fstab` | Host fstab mount path |
| `CHANNEL` | `latest` | Image channel to run: `latest` (stable releases) or `dev` (main branch builds). Controls which GHCR tag is pulled on self-update. |
| `SALTBOX_UI_DIR` | — | **Required for self-update.** Absolute path to the saltbox-ui project directory on the host (e.g. `/opt/saltbox-ui`). Used to invoke `docker compose up -d` after pulling the new image. |
| `GITHUB_REPO` | `javi11/saltbox-ui` | GitHub repository (`owner/repo`) used to fetch the latest release tag in the Settings page. |

## Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components by domain
│   ├── data/           # API layer + mock data
│   ├── server/         # Server-only modules (Docker, system, storage, Traefik)
│   ├── stores/         # Svelte 5 rune stores
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Formatting helpers, constants
├── routes/
│   ├── +page.svelte        # Dashboard
│   ├── apps/               # App management
│   ├── docker/             # Container management
│   ├── storage/            # Storage overview
│   └── system/             # System metrics
```

## License

[MIT](LICENSE)
