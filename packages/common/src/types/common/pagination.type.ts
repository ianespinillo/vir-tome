export interface IPaginationMeta {
	total: number;
	current_page: number;
	last_page: number;
	per_page: number; // Es útil devolver cuánto es el límite por página
}
