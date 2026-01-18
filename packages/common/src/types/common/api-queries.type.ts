import { IGeneric } from '../entities/generic.type';

export interface IQueriesDto<T extends IGeneric> {
	page?: number;
	limit?: number;
	search?: string;
	orderBy?: keyof T;
	orderDir?: 'ASC' | 'DESC';
	withDeleted?: boolean;
	fromDate?: Date;
	toDate?: Date;
	ids?: number[];
	relations?: keyof T[];
	fields?: (keyof T)[];
	isActive?: boolean;
}
