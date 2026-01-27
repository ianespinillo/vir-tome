import { IGeneric } from '../entities/generic.type';

// Ayudante para desglosar arrays y obtener el tipo base
type Unpack<T> = T extends (infer U)[] ? U : T;

// Decrementador de profundidad más robusto
type PrevDepth = [never, 0, 1, 2, 3, 4, 5];

// 1. Para el array 'relations': Solo nombres de objetos/entidades
export type RelationKeys<T, Depth extends number = 3> = [Depth] extends [0]
	? never
	: {
			[K in keyof T & string]: Unpack<T[K]> extends IGeneric
				? K | `${K}.${RelationKeys<Unpack<T[K]>, PrevDepth[Depth]>}`
				: never;
		}[keyof T & string];

// 2. Para el array 'fields': Permite llegar a las propiedades primitivas (name, email, etc.)
export type AllPaths<T, Depth extends number = 3> = [Depth] extends [0]
	? never
	: {
			[K in keyof T & string]: Unpack<T[K]> extends IGeneric
				? K | `${K}.${AllPaths<Unpack<T[K]>, PrevDepth[Depth]>}`
				: K; // Aquí permitimos campos que no son IGeneric (primitivos)
		}[keyof T & string];

export interface IQueriesDto<T extends IGeneric> {
	page?: number;
	limit?: number;
	search?: string;
	orderBy?: AllPaths<T>; // Puedes ordenar por campos anidados
	orderDir?: 'ASC' | 'DESC';
	withDeleted?: boolean;
	fromDate?: Date;
	toDate?: Date;
	ids?: number[];
	relations?: RelationKeys<T>[];
	fields?: AllPaths<T>[]; // Permite ['id', 'name', 'profile.bio', 'profile.avatar']
	isActive?: boolean;
}
