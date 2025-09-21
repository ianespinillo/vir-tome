import { GenericService } from '@/core/generic.service';
// src/tenants/tenants.service.ts
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTenantDto, UpdateTenantDto } from '@repo/common';
import { IsNull, Repository } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
	constructor(
		@InjectRepository(TenantEntity)
		private readonly tenantRepository: Repository<TenantEntity>,
	) {}

	async create(createTenantDto: CreateTenantDto): Promise<TenantEntity> {
		// Verificar que el subdomain no existe
		const existingTenant = await this.tenantRepository.findOne({
			where: { subdomain: createTenantDto.subdomain, deleted_at: IsNull() },
		});

		if (existingTenant) {
			throw new BadRequestException(
				`Subdomain '${createTenantDto.subdomain}' already exists`,
			);
		}

		// Verificar que el email no existe
		const existingEmail = await this.tenantRepository.findOne({
			where: {
				contact_email: createTenantDto.contact_email,
				deleted_at: IsNull(),
			},
		});

		if (existingEmail) {
			throw new BadRequestException(
				`Email '${createTenantDto.contact_email}' already exists`,
			);
		}
		const tenant = this.tenantRepository.create({
			...createTenantDto,
			is_active: createTenantDto.is_active ?? true,
			is_demo: createTenantDto.is_demo ?? false,
			plan: createTenantDto.plan ?? 'basic',
			settings: {
				theme: 'light',
				features: ['basic_library'],
				school_info: {},
				limits: {
					max_books: 1000,
					max_users: 50,
					max_loans: 100,
				},
				...createTenantDto.settings,
			},
		});
		return this.tenantRepository.save(tenant);
	}

	async findAll(): Promise<TenantEntity[]> {
		return await this.tenantRepository.find({
			where: { deleted_at: IsNull() },
			order: { created_at: 'DESC' },
		});
	}

	async findActive(): Promise<TenantEntity[]> {
		return await this.tenantRepository.find({
			where: { is_active: true, deleted_at: IsNull() },
			order: { name: 'ASC' },
		});
	}

	async findById(id: number): Promise<TenantEntity> {
		const tenant = await this.tenantRepository.findOne({
			where: { id, deleted_at: IsNull() },
		});

		if (!tenant) {
			throw new NotFoundException(`Tenant with ID ${id} not found`);
		}

		return tenant;
	}

	async findBySubdomain(subdomain: string): Promise<TenantEntity> {
		const tenant = await this.tenantRepository.findOne({
			where: { subdomain, deleted_at: IsNull() },
		});

		if (!tenant) {
			throw new NotFoundException(
				`Tenant with subdomain '${subdomain}' not found`,
			);
		}

		if (!tenant.isActiveAndValid()) {
			throw new BadRequestException(
				`Tenant '${subdomain}' is not active or subscription expired`,
			);
		}

		return tenant;
	}

	async update(
		id: number,
		updateTenantDto: UpdateTenantDto,
	): Promise<TenantEntity> {
		const tenant = await this.findById(id);

		// Si se está actualizando el subdomain, verificar que no existe
		if (
			updateTenantDto.subdomain &&
			updateTenantDto.subdomain !== tenant.subdomain
		) {
			const existingSubdomain = await this.tenantRepository.findOne({
				where: { subdomain: updateTenantDto.subdomain, deleted_at: IsNull() },
			});

			if (existingSubdomain) {
				throw new BadRequestException(
					`Subdomain '${updateTenantDto.subdomain}' already exists`,
				);
			}
		}

		// Si se está actualizando el email, verificar que no existe
		if (
			updateTenantDto.contact_email &&
			updateTenantDto.contact_email !== tenant.contact_email
		) {
			const existingEmail = await this.tenantRepository.findOne({
				where: {
					contact_email: updateTenantDto.contact_email,
					deleted_at: IsNull(),
				},
			});

			if (existingEmail) {
				throw new BadRequestException(
					`Email '${updateTenantDto.contact_email}' already exists`,
				);
			}
		}

		// Merge settings si se proporcionan
		if (updateTenantDto.settings) {
			updateTenantDto.settings = {
				...tenant.settings,
				...updateTenantDto.settings,
			};
		}

		await this.tenantRepository.update(id, updateTenantDto);
		return await this.findById(id);
	}

	async remove(id: number): Promise<void> {
		const tenant = await this.findById(id);

		// Soft delete
		await this.tenantRepository.update(id, {
			deleted_at: new Date(),
			is_active: false,
		});
	}

	async activate(id: number): Promise<TenantEntity> {
		await this.tenantRepository.update(id, { is_active: true });
		return await this.findById(id);
	}

	async deactivate(id: number): Promise<TenantEntity> {
		await this.tenantRepository.update(id, { is_active: false });
		return await this.findById(id);
	}

	// Métodos para statistics/admin
	async getStats() {
		const [total, active, demo] = await Promise.all([
			this.tenantRepository.count({ where: { deleted_at: IsNull() } }),
			this.tenantRepository.count({
				where: { is_active: true, deleted_at: IsNull() },
			}),
			this.tenantRepository.count({
				where: { is_demo: true, deleted_at: IsNull() },
			}),
		]);

		return {
			total,
			active,
			inactive: total - active,
			demo,
			production: total - demo,
		};
	}
}
