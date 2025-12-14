export interface TenantSettings {
	theme?: 'light' | 'dark' | 'blue' | 'green';
	features?: string[];
	school_info?: {
		name?: string;
		address?: string;
		phone?: string;
		principal?: string;
		logo_url?: string;
	};
	limits?: {
		max_books?: number;
		max_users?: number;
		max_loans?: number;
	};
}
export interface ITenantStats {
	total: number;
	active: number;
	inactive: number;
	demo: number;
	production: number;
}
