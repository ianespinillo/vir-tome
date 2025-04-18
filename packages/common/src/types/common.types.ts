export interface IPaginatedResponse<T> {
	data: T[];
	total: number;
	current_page: number;
	last_page: number;
}
