const SLUG_RE = /^[a-z0-9-]+$/;
const SLUG_MAX_LENGTH = 64;
const CONTAINER_ID_OR_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const CONTAINER_ID_MAX_LENGTH = 64;
const LOG_COUNT_MAX = 1000;
const LOG_COUNT_DEFAULT = 100;

export function validateSlug(slug: string): string | null {
	if (!slug || slug.length > SLUG_MAX_LENGTH || !SLUG_RE.test(slug)) {
		return null;
	}
	return slug;
}

export function validateContainerIdOrName(id: string): string | null {
	if (!id || id.length > CONTAINER_ID_MAX_LENGTH || !CONTAINER_ID_OR_NAME_RE.test(id)) {
		return null;
	}
	return id;
}

export function clampLogCount(raw: string | null): number {
	const parsed = parseInt(raw || '', 10);
	if (isNaN(parsed) || parsed < 1) return LOG_COUNT_DEFAULT;
	return Math.min(parsed, LOG_COUNT_MAX);
}
