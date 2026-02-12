// src/users/services/users.service.ts
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	IPaginatedResponse,
	IUser,
	PASSWORD_SALT_ROUNDS,
	ROLES,
	Roles,
	SignInDto,
	SignUpDto,
	UsersQueriesDto,
} from '@repo/common';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { IAuthUser } from '../../core/core.types';
import { PasswordAdapter } from '../../core/passport-adapter';
import { QueryHelper } from '../../core/query-helper';
import { RoleEntity } from '../entities/role.entity';
import { UserTenantEntity } from '../entities/user-tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from './role.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly usersRepo: Repository<UserEntity>,
		@InjectRepository(UserTenantEntity)
		private readonly userTenantsRepo: Repository<UserTenantEntity>,
		private readonly rolesService: RoleService,
	) {}

	// ============================================
	// BÚSQUEDA DE USUARIOS
	// ============================================

	/**
	 * Buscar usuario por email (GLOBAL)
	 */
	async findByEmail(email: string): Promise<UserEntity | null> {
		return this.usersRepo.findOne({
			where: { email, deleted_at: IsNull() },
			relations: ['userTenants', 'userTenants.tenant', 'userTenants.role'],
		});
	}

	/**
	 * Buscar usuario por ID (GLOBAL)
	 */
	async findById(userId: number): Promise<UserEntity | null> {
		return this.usersRepo.findOne({
			where: { id: userId, deleted_at: IsNull() },
			relations: ['userTenants', 'userTenants.tenant', 'userTenants.role'],
		});
	}
	/**
	 * Buscar usuario por ID (en tenant)
	 */
	async findByIdInTenant(
		id: number,
		tenantId: number,
	): Promise<UserEntity | null> {
		const user = await this.usersRepo.findOne({
			where: {
				deleted_at: IsNull(),
				id,
				userTenants: {
					tenant_id: tenantId,
				},
			},
		});
		return user;
	}
	/**
	 * Verificar si un usuario tiene acceso a un tenant específico
	 */
	async hasAccessToTenant(userId: number, tenantId: number): Promise<boolean> {
		const userTenant = await this.userTenantsRepo.findOne({
			where: { user_id: userId, tenant_id: tenantId, is_active: true },
		});
		return !!userTenant;
	}

	/**
	 * Obtener rol del usuario en un tenant específico
	 */
	async getRoleInTenant(
		userId: number,
		tenantId: number,
	): Promise<RoleEntity | null> {
		const userTenant = await this.userTenantsRepo.findOne({
			where: { user_id: userId, tenant_id: tenantId, is_active: true },
			relations: ['role'],
		});
		return userTenant?.role || null;
	}

	/**
	 * Obtener todos los tenants de un usuario
	 */
	async getUserTenants(userId: number): Promise<UserTenantEntity[]> {
		return this.userTenantsRepo.find({
			where: { user_id: userId, is_active: true },
			relations: ['tenant', 'role'],
			order: { created_at: 'ASC' },
		});
	}

	/**
	 * Listar todos los usuarios de un tenant específico
	 */
	/**
	 * Listar todos los usuarios de un tenant específico
	 */
	async findAllByTenant(tenantId: number): Promise<UserEntity[]> {
		const userTenants = await this.userTenantsRepo.find({
			where: { tenant_id: tenantId, is_active: true },
			relations: ['user', 'role'],
		});

		return userTenants.map((ut) => {
			const user = ut.user;
			// Agregar el rol actual como propiedad temporal
			(user as any).currentRole = ut.role;
			(user as any).currentRoleId = ut.role_id;
			(user as any).tenant_id = ut.tenant_id;
			return user;
		});
	}

	// ============================================
	// CREAR USUARIOS
	// ============================================

	/**
	 * Crear usuario y asignarlo a un tenant con un rol
	 */
	async create(
		tenantId: number,
		data: SignUpDto,
	): Promise<{
		user: UserEntity;
		password: string;
	}> {
		const roleExists = await this.rolesService.findRoleByName(data.role);
		if (!roleExists) {
			throw new BadRequestException('Invalid role ID');
		}
		// 1. Verificar si email ya existe
		const existing = await this.usersRepo.findOne({
			where: { email: data.email },
		});

		if (existing) {
			if (existing.hasAccessToTenant(tenantId)) {
				throw new ConflictException('User already exists in this tenant');
			}
			throw new BadRequestException('User already exists globally');
		}
		// Crear nuevo usuario
		const { hashedPassword, password } =
			await PasswordAdapter.generateHashedPassword(PASSWORD_SALT_ROUNDS);
		const user = await this.usersRepo.save({
			email: data.email,
			name: data.name,
			surname: data.surname,
			password: hashedPassword,
		});
		await this.addUserToTenant(user.id, tenantId, roleExists.id);
		return { user, password };
	}
	/**
	 *
	 * Crear usuario global (sin tenant)
	 * Para SUPER_ADMIN por ejemplo
	 */
	async createGlobalUser(data: SignUpDto): Promise<{
		user: UserEntity;
		password: string;
	}> {
		const existing = await this.findByEmail(data.email);
		if (existing) {
			throw new ConflictException('Email already exists');
		}
		const { hashedPassword, password } =
			await PasswordAdapter.generateHashedPassword(PASSWORD_SALT_ROUNDS);

		await this.usersRepo.save({
			email: data.email,
			name: data.name,
			surname: data.surname,
			password: hashedPassword,
		});

		return {
			user: (await this.findByEmail(data.email)) as UserEntity,
			password,
		};
	}

	// ============================================
	// GESTIÓN DE TENANTS DE UN USUARIO
	// ============================================

	/**
	 * Agregar usuario a un tenant
	 */
	async addUserToTenant(
		userId: number,
		tenantId: number,
		roleId: number,
	): Promise<UserTenantEntity> {
		// Verificar si ya existe
		const existing = await this.userTenantsRepo.findOne({
			where: { user_id: userId, tenant_id: tenantId },
		});

		if (existing) {
			if (existing.is_active) {
				throw new ConflictException('User already in this tenant');
			}
			// Reactivar si estaba inactivo
			existing.is_active = true;
			existing.role_id = roleId;
			return this.userTenantsRepo.save(existing);
		}

		// Crear nueva relación
		return this.userTenantsRepo.save({
			user_id: userId,
			tenant_id: tenantId,
			role_id: roleId,
			is_active: true,
		});
	}

	/**
	 * Remover usuario de un tenant (soft delete)
	 */
	async removeUserFromTenant(userId: number, tenantId: number): Promise<void> {
		const userTenant = await this.userTenantsRepo.findOne({
			where: { user_id: userId, tenant_id: tenantId },
		});

		if (!userTenant) {
			throw new NotFoundException('User not found in this tenant');
		}

		userTenant.is_active = false;
		await this.userTenantsRepo.save(userTenant);
	}

	/**
	 * Cambiar rol de usuario en un tenant
	 */
	async changeRoleInTenant(
		userId: number,
		tenantId: number,
		newRoleId: number,
	): Promise<UserTenantEntity> {
		const userTenant = await this.userTenantsRepo.findOne({
			where: { user_id: userId, tenant_id: tenantId, is_active: true },
		});

		if (!userTenant) {
			throw new NotFoundException('User not found in this tenant');
		}

		userTenant.role_id = newRoleId;
		return this.userTenantsRepo.save(userTenant);
	}

	// ============================================
	// ACTUALIZAR / ELIMINAR
	// ============================================

	/**
	 * Actualizar datos del usuario (global)
	 */
	async update(
		userId: number,
		data: Partial<Pick<UserEntity, 'name' | 'surname' | 'email'>>,
	): Promise<UserEntity> {
		const user = await this.findById(userId);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Si cambia email, verificar que no exista
		if (data.email && data.email !== user.email) {
			const existing = await this.findByEmail(data.email);
			if (existing) {
				throw new ConflictException('Email already exists');
			}
		}

		await this.usersRepo.update(userId, data);
		return this.findById(userId) as Promise<UserEntity>;
	}

	/**
	 * Actualizar password
	 */
	async updatePassword(userId: number, newPassword: string): Promise<void> {
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await this.usersRepo.update(userId, { password: hashedPassword });
	}

	/**
	 * Soft delete de usuario (global)
	 * También desactiva todas sus relaciones con tenants
	 */
	async delete(userId: number): Promise<void> {
		const user = await this.findById(userId);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Desactivar en todos los tenants
		await this.userTenantsRepo.update({ user_id: userId }, { is_active: false });

		// Soft delete del usuario
		await this.usersRepo.softDelete(userId);
	}

	// ============================================
	// HELPERS
	// ============================================

	/**
	 * Verificar si un email existe
	 */
	async emailExists(email: string): Promise<boolean> {
		const count = await this.usersRepo.count({ where: { email } });
		return count > 0;
	}

	/**
	 * Buscar usuarios por nombre (para admin panel)
	 */
	async search(query: string, limit = 10): Promise<UserEntity[]> {
		return this.usersRepo
			.createQueryBuilder('user')
			.where(
				'user.name ILIKE :query OR user.surname ILIKE :query OR user.email ILIKE :query',
				{
					query: `%${query}%`,
				},
			)
			.andWhere('user.deleted_at IS NULL')
			.take(limit)
			.getMany();
	}

	/**
	 * Contar usuarios por tenant
	 */
	async countByTenant(tenantId: number): Promise<number> {
		return this.userTenantsRepo.count({
			where: { tenant_id: tenantId, is_active: true },
		});
	}

	/**
	 * Obtener estadísticas de usuarios por tenant
	 */
	async getTenantUserStats(tenantId: number) {
		const userTenants = await this.userTenantsRepo.find({
			where: { tenant_id: tenantId, is_active: true },
			relations: ['role'],
		});

		const stats = {
			total: userTenants.length,
			by_role: {} as Record<string, number>,
		};

		userTenants.forEach((ut) => {
			const roleName = ut.role.name;
			stats.by_role[roleName] = (stats.by_role[roleName] || 0) + 1;
		});

		return stats;
	}
	async getUsers(
		user: IAuthUser,
		queries: UsersQueriesDto,
	): Promise<IPaginatedResponse<IUser>> {
		const qb = this.usersRepo
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.userTenants', 'ut')
			.leftJoinAndSelect('ut.role', 'role')
			.leftJoinAndSelect('ut.tenant', 'tenant');

		// 1. Filtros de Integridad y Seguridad
		qb.where('user.deleted_at IS NULL');

		if (user.roleName === ROLES.ADMIN) {
			qb
				.andWhere('ut.tenant_id = :tenantId', {
					tenantId: user.tenantId,
				})
				.andWhere('role.name NOT IN (:...restricted)', {
					restricted: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
				});
		}

		// 2. Filtros Dinámicos del DTO
		if (queries.search) {
			qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', {
				q: `%${queries.search}%`,
			});
		}

		if (queries.roleName) {
			qb.andWhere('role.name = :roleName', { roleName: queries.roleName });
		}
		if (queries.rolesNames) {
			qb.andWhere('role.name IN (:...rolesNames)', {
				rolesNames: queries.rolesNames,
			});
		}

		if (queries.isActive !== undefined) {
			qb.andWhere('user.isActive = :isActive', { isActive: queries.isActive });
		}

		// 3. Aplicar Paginación y Retornar
		QueryHelper.applyBasePagination(qb, queries, 'user');

		return QueryHelper.getPaginatedResponse(qb, queries, (u) => {
			const { password, ...rest } = u;
			return rest as UserEntity;
		});
	}
	async findLastsRegistered(user: IAuthUser): Promise<UserEntity[]> {
		if (user.roleName === ROLES.ADMIN) {
			return this.usersRepo.find({
				where: {
					deleted_at: IsNull(),
				},
				order: {
					created_at: 'DESC',
				},
				take: 5,
			});
		}
		return this.usersRepo.find({
			where: {
				deleted_at: IsNull(),
				userTenants: {
					tenant_id: user.tenantId,
				},
			},
			relations: ['userTenants'],
			order: {
				created_at: 'DESC',
			},
			take: 5,
		});
	}
}
