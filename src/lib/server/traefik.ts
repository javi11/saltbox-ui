import type { TraefikRoute } from '$lib/types/system';

const TRAEFIK_API = process.env.TRAEFIK_API_URL || 'http://localhost:8080';

interface TraefikRouter {
	rule: string;
	service: string;
	tls?: { certResolver?: string } | Record<string, never>;
	middlewares?: string[];
	entryPoints?: string[];
	status?: string;
}

export async function getTraefikRoutes(): Promise<TraefikRoute[]> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);

		const res = await fetch(`${TRAEFIK_API}/api/http/routers`, {
			signal: controller.signal
		});
		clearTimeout(timeout);

		if (!res.ok) return [];

		const routers: TraefikRouter[] = await res.json();

		return routers.map((r) => ({
			rule: r.rule,
			service: r.service,
			tls: !!r.tls,
			middlewares: r.middlewares || [],
			entryPoints: r.entryPoints || []
		}));
	} catch {
		return [];
	}
}
