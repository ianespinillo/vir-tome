import { IQueriesDto } from "../common/api-queries.type";
import { IBook } from "../entities/book.type";
export interface IBooksQueries extends IQueriesDto<IBook> {
	// Filtros con semántica de negocio clara
	categoryIds?: number[];
	publisherId?: number;
	minYear?: number;
	maxYear?: number;
	hasAvailableStock?: boolean;
}