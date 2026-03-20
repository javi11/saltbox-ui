import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		activity: api.getActivity() // streamed, non-blocking
	};
};
