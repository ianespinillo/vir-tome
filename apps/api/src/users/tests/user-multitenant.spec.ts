import { getTestDatabaseConfig } from '@/__tests__/database-test.config';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ROLES, SignUpDto } from '@repo/common';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserTenantEntity } from '../entities/user-tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from '../services/role.service';
import { UsersService } from '../services/users.service';

describe('Users Multi-tenant Integration (Container)', () => {
	let app: TestingModule;
	let dataSource: DataSource;
	let usersService: UsersService;
	let roleService: RoleService;
	let tenantRepository: any;

	let tenant1: TenantEntity;
	let tenant2: TenantEntity;
	let defaultRole1: RoleEntity;
	let defaultRole2: RoleEntity;

	const mockEmailService = {
		sendEmailWelcome: jest.fn().mockResolvedValue(true),
	};

	beforeAll(async () => {
		const dbConfig = await getTestDatabaseConfig();

		app = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(dbConfig),
				TypeOrmModule.forFeature([
					TenantEntity,
					UserEntity,
					RoleEntity,
					UserTenantEntity,
				]),
			],
			providers: [UsersService, RoleService],
		}).compile();

		dataSource = app.get<DataSource>(DataSource);

		usersService = app.get<UsersService>(UsersService);
		roleService = app.get<RoleService>(RoleService);
		tenantRepository = dataSource.getRepository(TenantEntity);

		// Crear tenants de prueba
		tenant1 = await tenantRepository.save({
			subdomain: 'school-alpha',
			name: 'Alpha School',
			contact_email: 'admin@alpha.edu',
			is_active: true,
		});

		tenant2 = await tenantRepository.save({
			subdomain: 'school-beta',
			name: 'Beta School',
			contact_email: 'admin@beta.edu',
			is_active: true,
		});

		// Crear roles por defecto para ambos tenants
		defaultRole1 = await roleService.createRole(ROLES.STUDENT, tenant1.id);
		defaultRole2 = await roleService.createRole(ROLES.STUDENT, tenant2.id);
	}, 100000);

	afterAll(async () => {
		if (app) await app.close();
	});

	beforeEach(async () => {
		// --- LIMPIEZA EN ORDEN CORRECTO ---
		// 1. Primero borrar las relaciones (Hijos)
		await dataSource.getRepository(UserTenantEntity).delete({});

		// 2. Luego borrar las entidades principales (Padres)
		await dataSource.getRepository(UserEntity).delete({});

		// 3. Roles
		await dataSource.getRepository(RoleEntity).delete({ tenant_id: tenant1.id });
		await dataSource.getRepository(RoleEntity).delete({ tenant_id: tenant2.id });

		// Recrear roles por defecto
		defaultRole1 = await roleService.createRole(ROLES.STUDENT, tenant1.id);
		defaultRole2 = await roleService.createRole(ROLES.STUDENT, tenant2.id);

		jest.clearAllMocks();
	});

	describe('User Isolation', () => {
		test('should create users isolated by tenant', async () => {
			const userData: SignUpDto = {
				name: 'John',
				surname: 'Doe',
				email: 'john.doe@test.com',
				roleId: defaultRole1.id,
			};

			const userData2: SignUpDto = {
				name: 'Jane',
				surname: 'Smith',
				email: 'jane.smith@test.com',
				roleId: defaultRole2.id,
			};

			const user1 = await usersService.create(tenant1.id, userData);
			const user2 = await usersService.create(tenant2.id, userData2);

			expect(user1.user).toHaveProperty('id');
			expect(user1.user.email).toBe('john.doe@test.com');
			expect(user1.user.name).toBe('John');

			expect(user2.user.email).toBe('jane.smith@test.com');
			expect(user2.user.name).toBe('Jane');
			expect(user1.user.id).not.toBe(user2.user.id);
		});

		test('should prevent duplicate emails within same tenant', async () => {
			const userData: SignUpDto = {
				name: 'John',
				surname: 'Doe',
				email: 'duplicate@test.com',
				roleId: defaultRole1.id,
			};

			await usersService.create(tenant1.id, userData);

			await expect(
				usersService.create(tenant1.id, {
					...userData,
					name: 'Jane',
				}),
			).rejects.toThrow(BadRequestException);
		});

		test('should prevent creating user with role from different tenant', async () => {
			const userData: SignUpDto = {
				name: 'Hacker',
				surname: 'User',
				email: 'hacker@test.com',
				roleId: defaultRole2.id,
			};

			await expect(usersService.create(tenant1.id, userData)).rejects.toThrow(
				BadRequestException,
			);
		});

		test('should find users only from specific tenant', async () => {
			await usersService.create(tenant1.id, {
				name: 'Alpha User 1',
				surname: 'One',
				email: 'user1@alpha.com',
				roleId: defaultRole1.id,
			});
			await usersService.create(tenant1.id, {
				name: 'Alpha User 2',
				surname: 'One',
				email: 'user2@alpha.com',
				roleId: defaultRole1.id,
			});
			await usersService.create(tenant2.id, {
				name: 'Beta User 1',
				surname: 'One',
				email: 'user1@beta.com',
				roleId: defaultRole2.id,
			});

			const tenant1Users = await usersService.findAllByTenant(tenant1.id);
			const tenant2Users = await usersService.findAllByTenant(tenant2.id);

			expect(tenant1Users).toHaveLength(2);
			expect(
				tenant1Users.every((user: any) => user.tenant_id === tenant1.id),
			).toBe(true);

			expect(tenant2Users).toHaveLength(1);
			expect(tenant2Users[0].name).toBe('Beta User 1');
		});

		test('should prevent duplicate emails globally across all tenants', async () => {
			const email = 'shared@email.com';

			// Crear usuario en tenant1
			await usersService.create(tenant1.id, {
				name: 'User in Tenant 1',
				surname: 'One',
				email,
				roleId: defaultRole1.id,
			});

			// Intentar crear otro usuario con el mismo email en tenant2 debería fallar
			await expect(
				usersService.create(tenant2.id, {
					name: 'User in Tenant 2',
					surname: 'Two',
					email,
					roleId: defaultRole2.id,
				}),
			).rejects.toThrow();

			// Verificar que solo existe un usuario con ese email
			const foundUser = await usersService.findByEmail(email);

			expect(foundUser).toBeDefined();
			expect(foundUser?.email).toBe(email);
			expect(foundUser?.name).toBe('User in Tenant 1');

			// El usuario solo debería tener acceso a tenant1
			expect(foundUser?.hasAccessToTenant(tenant1.id)).toBe(true);
			expect(foundUser?.hasAccessToTenant(tenant2.id)).toBe(false);

			// El usuario solo debería tener 1 tenant asociado
			expect(foundUser?.getTenants()).toHaveLength(1);
			expect(foundUser?.getTenants()[0].id).toBe(tenant1.id);
		});
	});

	describe('Role Isolation', () => {
		test('should create roles isolated by tenant', async () => {
			const role1 = await roleService.createRole(ROLES.ADMIN, tenant1.id);
			const role2 = await roleService.createRole(ROLES.ADMIN, tenant2.id);

			expect(role1.name).toBe(ROLES.ADMIN);
			expect(role1.tenant_id).toBe(tenant1.id);

			expect(role2.name).toBe(ROLES.ADMIN);
			expect(role2.tenant_id).toBe(tenant2.id);
		});

		test('should prevent duplicate role names within same tenant', async () => {
			await roleService.createRole(ROLES.TEACHER, tenant1.id);

			await expect(
				roleService.createRole(ROLES.TEACHER, tenant1.id),
			).rejects.toThrow(BadRequestException);
		});

		test('should find roles only from specific tenant', async () => {
			await roleService.createRole(ROLES.ADMIN, tenant1.id);
			await roleService.createRole(ROLES.LIBRARIAN, tenant2.id);

			const tenant1Roles = await roleService.findAllRoles(tenant1.id);
			const tenant2Roles = await roleService.findAllRoles(tenant2.id);

			expect(tenant1Roles).toHaveLength(2);
			expect(tenant1Roles.every((role) => role.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(tenant2Roles).toHaveLength(2);
			expect(tenant2Roles.every((role) => role.tenant_id === tenant2.id)).toBe(
				true,
			);
		});

		test('should initialize default roles independently per tenant', async () => {
			const newTenant1 = await tenantRepository.save({
				subdomain: 'new-school-1',
				name: 'New School 1',
				contact_email: 'admin@new1.edu',
				is_active: true,
			});

			const newTenant2 = await tenantRepository.save({
				subdomain: 'new-school-2',
				name: 'New School 2',
				contact_email: 'admin@new2.edu',
				is_active: true,
			});

			const roles1 = await roleService.initializeDefaultRoles(newTenant1.id);
			const roles2 = await roleService.initializeDefaultRoles(newTenant2.id);

			expect(roles1).toHaveLength(4);
			expect(roles1.every((role) => role.tenant_id === newTenant1.id)).toBe(true);

			expect(roles2).toHaveLength(4);
			expect(roles2.every((role) => role.tenant_id === newTenant2.id)).toBe(true);

			const roleNames1 = roles1.map((r) => r.name);
			const roleNames2 = roles2.map((r) => r.name);

			expect(roleNames1).toContain(ROLES.ADMIN);
			expect(roleNames1).toContain(ROLES.LIBRARIAN);
			expect(roleNames1).toContain(ROLES.TEACHER);
			expect(roleNames1).toContain(ROLES.STUDENT);

			expect(roleNames2).toContain(ROLES.ADMIN);
			expect(roleNames2).toContain(ROLES.LIBRARIAN);
			expect(roleNames2).toContain(ROLES.TEACHER);
			expect(roleNames2).toContain(ROLES.STUDENT);
		});

		test('should get default roles only from specific tenant', async () => {
			await dataSource.getRepository(RoleEntity).delete({ tenant_id: tenant1.id });
			await dataSource.getRepository(RoleEntity).delete({ tenant_id: tenant2.id });

			await roleService.initializeDefaultRoles(tenant1.id);
			await roleService.initializeDefaultRoles(tenant2.id);

			const defaultRoles1 = await roleService.getDefaultRoles(tenant1.id);
			const defaultRoles2 = await roleService.getDefaultRoles(tenant2.id);

			expect(defaultRoles1).toHaveLength(4);
			expect(defaultRoles1.every((role) => role.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(defaultRoles2).toHaveLength(4);
			expect(defaultRoles2.every((role) => role.tenant_id === tenant2.id)).toBe(
				true,
			);
		});
	});

	describe('Cross-Entity Relationships', () => {
		test('should maintain proper relationships within tenant boundaries', async () => {
			await dataSource.getRepository(RoleEntity).delete({ tenant_id: tenant1.id });

			const adminRole = await roleService.createRole(ROLES.ADMIN, tenant1.id);

			const createdUser = await usersService.create(tenant1.id, {
				name: 'Admin User',
				email: 'admin@tenant1.com',
				roleId: adminRole.id,
				surname: 'User',
			});

			// Buscar el usuario con las relaciones cargadas para poder usar los métodos helper
			const userWithRelations =
				await usersService.findByEmail('admin@tenant1.com');

			expect(userWithRelations).toBeDefined();
			expect(userWithRelations?.getTenants()).toHaveLength(1);
			expect(userWithRelations?.getTenants()[0].id).toBe(tenant1.id);
			expect(adminRole.tenant_id).toBe(tenant1.id);
		});
	});
});
