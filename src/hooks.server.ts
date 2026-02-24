import type { Handle } from '@sveltejs/kit';

const isDev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Rate limiter (simple sliding-window per action)
// ---------------------------------------------------------------------------

const rateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS: Record<string, number> = {
	'/api/apps/': 5,
	'/api/actions': 3,
	'/api/containers/': 10
};

function isRateLimited(pathname: string): boolean {
	const prefix = Object.keys(RATE_LIMITS).find((p) => pathname.startsWith(p));
	if (!prefix) return false;

	const limit = RATE_LIMITS[prefix];
	const now = Date.now();
	const bucket = rateBuckets.get(prefix) ?? [];
	const filtered = bucket.filter((t) => now - t < RATE_WINDOW_MS);

	if (filtered.length >= limit) {
		rateBuckets.set(prefix, filtered);
		return true;
	}

	filtered.push(now);
	rateBuckets.set(prefix, filtered);
	return false;
}

// ---------------------------------------------------------------------------
// Body size guard (1 MB)
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 1_048_576;

// ---------------------------------------------------------------------------
// Security response headers
// ---------------------------------------------------------------------------

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'X-XSS-Protection': '0'
};

// ---------------------------------------------------------------------------
// Handle hook
// ---------------------------------------------------------------------------

export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;
	const method = request.method;

	// --- 0. Health check bypass (Docker HEALTHCHECK calls this directly) ----
	if (url.pathname === '/health') {
		return new Response('ok', { status: 200 });
	}

	// --- 1. Authelia header check (skip in dev for local testing) -----------
	const remoteUser = request.headers.get('remote-user');

	if (!isDev && !remoteUser) {
		return new Response('Unauthorized', { status: 401 });
	}

	event.locals.user = remoteUser || 'dev';

	// --- 2. CSRF Origin check on mutating requests -------------------------
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
		const origin = request.headers.get('origin');
		const expected = url.origin;

		if (!origin || origin !== expected) {
			return new Response('Forbidden – origin mismatch', { status: 403 });
		}
	}

	// --- 3. Body size limit on requests with body --------------------------
	if (['POST', 'PUT', 'PATCH'].includes(method)) {
		const contentLength = request.headers.get('content-length');
		if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
			return new Response('Payload too large', { status: 413 });
		}
	}

	// --- 4. Rate limiting on API mutations ---------------------------------
	if (url.pathname.startsWith('/api/') && method === 'POST') {
		if (isRateLimited(url.pathname)) {
			return new Response('Too many requests', { status: 429 });
		}
	}

	// --- 5. Resolve & attach security headers ------------------------------
	const response = await resolve(event);

	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(key)) {
			response.headers.set(key, value);
		}
	}

	return response;
};
