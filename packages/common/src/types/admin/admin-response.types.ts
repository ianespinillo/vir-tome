export interface IDashboardResponse {
	total_tenants: number;
	active_tenants: number;
	total_users: number;
	total_books: number;
	active_loans: number;
	recent_tenants: Array<{
		id: number;
		name: string;
		subdomain: string;
		created_at: Date;
		plan: string;
		status: boolean;
	}>;
}
