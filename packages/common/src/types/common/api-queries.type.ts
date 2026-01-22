import { IGeneric } from '../entities/generic.type';

export type RelationKeys<T, Depth extends number = 3> = [Depth] extends [never]
	? never
	: {
		[K in keyof T]: T[K] extends IGeneric | IGeneric[]
			? K | `${K & string}.${RelationKeys<T[K], PrevDepth<Depth>> & string}`
			: never;
	}[keyof T];

type PrevDepth<N extends number> = [never, 0, 1, 2, 3, 4, 5][N];

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
	relations?: RelationKeys<T>[];
	fields?: (keyof T)[];
	isActive?: boolean;
}
