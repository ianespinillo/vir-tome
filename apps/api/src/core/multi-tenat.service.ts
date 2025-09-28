import { ForbiddenException, NotFoundException } from '@nestjs/common';
// src/core/multitenant.service.ts
import {
	DeepPartial,
	FindManyOptions,
	FindOneOptions,
	FindOptionsWhere,
	ILike,
	In,
	IsNull,
	Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { MultiTenantEntity } from './multi-tenant.entity';

export abstract class MultiTenantService<T extends MultiTenantEntity> {
	constructor(protected repository: Repository<T>) {}

	/**
	 * Agregar tenant_id automáticamente a todas las condiciones WHERE
	 */
	private addTenantFilter(
		tenantId: number,
		whereOptions?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
	): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
		const baseFilter = { tenant_id: tenantId, deleted_at: null };

		if (!whereOptions) {
			return baseFilter as unknown as FindOptionsWhere<T>;
		}

		if (Array.isArray(whereOptions)) {
			return whereOptions.map((condition) => ({
				...condition,
				...baseFilter,
			})) as FindOptionsWhere<T>[];
		}

		return { ...whereOptions, ...baseFilter } as FindOptionsWhere<T>;
	}

	/**
	 * Validar que la entidad pertenece al tenant
	 */
	private validateTenantAccess(entity: T, tenantId: number): void {
		if (entity.tenant_id !== tenantId) {
			throw new ForbiddenException(
				'Access denied: Entity belongs to different tenant',
			);
		}
	}

	// =================================================================
	// MÉTODOS PÚBLICOS
	// =================================================================

	async findAll(
		tenantId: number,
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<T[]> {
		return this.repository.find({
			where: this.addTenantFilter(tenantId),
			order: { id: 'DESC' } as any,
			...options,
		});
	}

	async findById(tenantId: number, id: number): Promise<T | null> {
		return this.repository.findOne({
			where: this.addTenantFilter(tenantId, {
				id,
			} as unknown as FindOptionsWhere<T>),
		});
	}

	async findByIdOrFail(tenantId: number, id: number): Promise<T> {
		const entity = await this.findById(tenantId, id);
		if (!entity) {
			throw new NotFoundException(
				`Entity with ID ${id} not found for this tenant`,
			);
		}
		return entity;
	}

	async findBy(
		tenantId: number,
		whereOptions: FindOptionsWhere<T>,
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<T[]> {
		return this.repository.find({
			where: this.addTenantFilter(tenantId, whereOptions),
			...options,
		});
	}

	async findOne(
		tenantId: number,
		whereOptions: FindOptionsWhere<T>,
		options?: Omit<FindOneOptions<T>, 'where'>,
	): Promise<T | null> {
		return this.repository.findOne({
			where: this.addTenantFilter(tenantId, whereOptions),
			...options,
		});
	}

	async create(tenantId: number, entityData: DeepPartial<T>): Promise<T> {
		const entityWithTenant = {
			...entityData,
			tenant_id: tenantId,
		} as DeepPartial<T>;

		const entity = this.repository.create(entityWithTenant);
		return this.repository.save(entity);
	}

	async update(
		tenantId: number,
		id: number,
		updateData: DeepPartial<T>,
	): Promise<T> {
		await this.findByIdOrFail(tenantId, id);

		// Type assertion seguro con verificación
		const data = updateData as Record<string, unknown>;
		const { tenant_id: _, ...sanitizedData } = data;

		await this.repository.update(id, sanitizedData as QueryDeepPartialEntity<T>);
		return this.findByIdOrFail(tenantId, id);
	}

	async delete(tenantId: number, id: number): Promise<void> {
		// Verificar que la entidad existe y pertenece al tenant
		await this.findByIdOrFail(tenantId, id);
		// Soft delete
		await this.repository.update(
			{ id, tenant_id: tenantId } as any,
			{ deleted_at: new Date() } as any,
		);
	}

	async hardDelete(tenantId: number, id: number): Promise<void> {
		// Verificar que la entidad existe y pertenece al tenant
		await this.findByIdOrFail(tenantId, id);

		await this.repository.delete(id);
	}

	// =================================================================
	// MÉTODOS DE PAGINACIÓN
	// =================================================================

	async findByPage(
		tenantId: number,
		page = 1,
		pageSize = 10,
		whereOptions?: FindOptionsWhere<T>,
		options?: Omit<FindManyOptions<T>, 'where' | 'take' | 'skip'>,
	) {
		const skip = (page - 1) * pageSize;

		const [data, total] = await this.repository.findAndCount({
			where: this.addTenantFilter(tenantId, whereOptions),
			order: { id: 'DESC' } as any,
			take: pageSize,
			skip,
			...options,
		});

		return {
			data,
			total,
			current_page: page,
			last_page: Math.ceil(total / pageSize),
			per_page: pageSize,
			from: skip + 1,
			to: skip + data.length,
		};
	}

	// =================================================================
	// MÉTODOS DE BÚSQUEDA
	// =================================================================

	async findByName(
		tenantId: number,
		search: string,
		field: keyof T = 'name' as keyof T, // default 'name'
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<T[]> {
		return this.repository.find({
			where: this.addTenantFilter(tenantId, {
				[field]: ILike(`%${search}%`),
			} as unknown as FindOptionsWhere<T>),
			...options,
		});
	}

	async findByField(
		tenantId: number,
		field: keyof T,
		value: any,
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<T[]> {
		return this.repository.find({
			where: this.addTenantFilter(tenantId, {
				[field]: value,
			} as FindOptionsWhere<T>),
			...options,
		});
	}

	async searchByFields(
		tenantId: number,
		searchTerm: string,
		fields: (keyof T)[],
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<T[]> {
		const whereConditions = fields.map((field) => ({
			...this.addTenantFilter(tenantId),
			[field]: ILike(`%${searchTerm}%`),
		})) as FindOptionsWhere<T>[];

		return this.repository.find({
			where: whereConditions,
			...options,
		});
	}

	// =================================================================
	// MÉTODOS DE CONTEO Y ESTADÍSTICAS
	// =================================================================

	async count(
		tenantId: number,
		whereOptions?: FindOptionsWhere<T>,
	): Promise<number> {
		return this.repository.count({
			where: this.addTenantFilter(tenantId, whereOptions),
		});
	}

	async exists(
		tenantId: number,
		whereOptions: FindOptionsWhere<T>,
	): Promise<boolean> {
		const count = await this.repository.count({
			where: this.addTenantFilter(tenantId, whereOptions),
		});
		return count > 0;
	}

	async findAndCount(
		tenantId: number,
		whereOptions?: FindOptionsWhere<T>,
		options?: Omit<FindManyOptions<T>, 'where'>,
	): Promise<[T[], number]> {
		return this.repository.findAndCount({
			where: this.addTenantFilter(tenantId, whereOptions),
			...options,
		});
	}

	// =================================================================
	// MÉTODOS BATCH
	// =================================================================

	async createMany(
		tenantId: number,
		entitiesData: DeepPartial<T>[],
	): Promise<T[]> {
		const entitiesWithTenant = entitiesData.map((data) => ({
			...data,
			tenant_id: tenantId,
		})) as DeepPartial<T>[];

		const entities = this.repository.create(entitiesWithTenant);
		return this.repository.save(entities);
	}

	async deleteMany(tenantId: number, ids: number[]): Promise<void> {
		// Verificar que todas las entidades pertenecen al tenant
		const entities = await this.repository.find({
			where: {
				id: In(ids) as any,
				tenant_id: tenantId,
				deleted_at: null,
			} as FindOptionsWhere<T>,
		});

		if (entities.length !== ids.length) {
			throw new NotFoundException(
				'Some entities not found or do not belong to this tenant',
			);
		}

		// Soft delete batch
		await this.repository.update(ids, { deleted_at: new Date() } as any);
	}

	// =================================================================
	// MÉTODOS DE UTILIDAD
	// =================================================================

	async getStats(tenantId: number): Promise<{
		total: number;
		active: number;
		deleted: number;
	}> {
		const [total, active] = await Promise.all([
			this.repository.count({
				where: { tenant_id: tenantId } as FindOptionsWhere<T>,
				withDeleted: true,
			}),
			this.repository.count({
				where: {
					tenant_id: tenantId,
					deleted_at: IsNull(),
				} as unknown as FindOptionsWhere<T>,
			}),
		]);
		return {
			total,
			active,
			deleted: total - active,
		};
	}

	/**
	 * Método para limpiar cache o realizar operaciones de mantenimiento
	 * Implementar en clases derivadas si es necesario
	 */
	async clearCache?(tenantId: number): Promise<void>;

	/**
	 * Método para validaciones específicas del dominio
	 * Implementar en clases derivadas
	 */
	protected async validate?(
		tenantId: number,
		data: DeepPartial<T>,
	): Promise<void>;
}
