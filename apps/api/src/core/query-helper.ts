import { BaseQueriesDto, IGeneric } from '@repo/common';
import { SelectQueryBuilder } from 'typeorm';

export class QueryHelper {
	/**
	 * Aplicamos filtros base respetando el tipo de la Entidad
	 */
	static applyBaseFilters<TEntity extends IGeneric>(
		qb: SelectQueryBuilder<TEntity>,
		queries: BaseQueriesDto<TEntity>,
		alias: string,
	): void {
		// Filtro por IDs
		if (queries.ids?.length) {
			qb.andWhere(`${alias}.id IN (:...ids)`, { ids: queries.ids });
		}

		// Filtros de fecha
		if (queries.fromDate) {
			qb.andWhere(`${alias}.createdAt >= :fromDate`, {
				fromDate: queries.fromDate,
			});
		}
		if (queries.toDate) {
			qb.andWhere(`${alias}.createdAt <= :toDate`, { toDate: queries.toDate });
		}

		// Filtro isActive
		if (queries.isActive !== undefined) {
			qb.andWhere(`${alias}.isActive = :isActive`, { isActive: queries.isActive });
		}
	}

	/**
	 * Paginación y Ordenamiento tipado
	 */
	static applyBasePagination<TEntity extends IGeneric>(
		qb: SelectQueryBuilder<TEntity>,
		queries: BaseQueriesDto<TEntity>,
		alias: string,
	): void {
		const { page = 1, limit = 10, orderBy, orderDir = 'ASC' } = queries;

		qb.skip((page - 1) * limit).take(limit);

		if (orderBy) {
			// Forzamos a string para el QueryBuilder, pero TypeScript ya validó
			// que 'orderBy' es una clave válida de TEntity en el DTO
			qb.orderBy(`${alias}.${String(orderBy)}`, orderDir);
		}
	}

	/**
	 * Respuesta paginada con transformador tipado
	 */
	static async getPaginatedResponse<
		TEntity extends IGeneric,
		TResponse = TEntity,
	>(
		qb: SelectQueryBuilder<TEntity>,
		queries: BaseQueriesDto<TEntity>,
		transformFn?: (item: TEntity) => TResponse,
	) {
		const [rows, count] = await qb.getManyAndCount();
		const page = queries.page || 1;
		const limit = queries.limit || 10;

		return {
			items: transformFn
				? rows.map(transformFn)
				: (rows as unknown as TResponse[]),
			meta: {
				current_page: page,
				per_page: limit,
				last_page: Math.ceil(count / limit),
				total: count,
			},
		};
	}
}
