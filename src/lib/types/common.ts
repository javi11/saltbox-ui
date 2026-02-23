export type Status = 'running' | 'stopped' | 'error' | 'updating' | 'installing';

export interface TimeRange {
	start: Date;
	end: Date;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}
