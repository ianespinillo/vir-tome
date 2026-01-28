import { GenericService } from '@/core/generic.service';
import { EmailService } from '@/email/email.service';
import { RoleService } from '@/users/services/role.service';
import { UsersService } from '@/users/services/users.service';
// src/tenants/tenants.service.ts
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	CreateTenantDto,
	IPaginatedResponse,
	ROLES,
	Roles,
	UpdateTenantDto,
} from '@repo/common';
import { ILike, IsNull, Repository } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
	constructor(
		@InjectRepository(TenantEntity)
		private readonly tenantRepository: Repository<TenantEntity>,
		private readonly userService: UsersService,
		private readonly emailService: EmailService,
		private readonly roleService: RoleService,
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
		const saved = await this.tenantRepository.save({
			...createTenantDto,
			is_active: createTenantDto.is_active ?? true,
			is_demo: createTenantDto.is_demo ?? false,
			plan: createTenantDto.plan ?? 'basic',
			settings: {
				theme: createTenantDto.settings?.theme,
				features: createTenantDto.settings?.features,
				school_info: createTenantDto.settings?.school_info,
				limits: createTenantDto.settings?.limits,
				...createTenantDto.settings,
			},
		});
		const role = await this.roleService.findRoleByName(ROLES.ADMIN);
		if (!role) throw new ConflictException('No admin role registered');
		// creo el primer admin
		const { user, password } = await this.userService.create(saved.id, {
			email: createTenantDto.admin_email,
			name: createTenantDto.admin_name,
			surname: createTenantDto.admin_surname,
			role: role.name,
		});
		await this.emailService.sendEmailWelcome({
			to: user.email,
			password,
		});
		return saved;
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

	async findBySubdomain(subdomain: string): Promise<TenantEntity | null> {
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
			updateTenantDto.subdomain !== tenant?.subdomain
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
			updateTenantDto.contact_email !== tenant?.contact_email
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
				...tenant?.settings,
				...updateTenantDto.settings,
			};
		}

		await this.tenantRepository.update(id, updateTenantDto);
		return await this.findById(id);
	}

	async remove(id: number): Promise<void> {
		const tenant = await this.findById(id);
		if (!tenant) throw new NotFoundException(`Tenant with ID ${id} not founded`); // Soft delete
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
	async getLastsTenants(): Promise<TenantEntity[]> {
		return this.tenantRepository.find({
			where: { deleted_at: IsNull() },
			order: {
				created_at: 'ASC',
			},
			take: 5,
		});
	}
	async findByName(name: string): Promise<TenantEntity[]> {
		return await this.tenantRepository.find({
			where: { name: ILike(`%${name}%`), deleted_at: IsNull() },
		});
	}
	async findPaginatedTenants(
		page: number,
		searchTerm?: string,
	): Promise<IPaginatedResponse<TenantEntity>> {
		const take = 6;
		const skip = (page - 1) * take;
		if (!searchTerm) {
			const [data, count] = await this.tenantRepository.findAndCount({
				where: {
					deleted_at: IsNull(),
				},
				order: { id: 'DESC' },
				skip,
				take,
			});
			return {
				items: data,
				meta: {
					total: count,
					current_page: page,
					last_page: Math.ceil(count / take),
					per_page: take,
				},
			};
		}
		const [data, count] = await this.tenantRepository.findAndCount({
			where: {
				name: ILike(`%${searchTerm}%`),
				deleted_at: IsNull(),
			},
			order: { id: 'DESC' },
			skip,
			take,
		});
		return {
			items: data,
			meta: {
				total: count,
				current_page: page,
				last_page: Math.ceil(count / take),
				per_page: take,
			},
		};
	}
}
