import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ROLES, SignUpDto } from '@repo/common';
import { DataSource } from 'typeorm';
import { getTestDatabaseConfig } from '../../__tests__/database-test.config';
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

		// Crear roles por defecto globales
		defaultRole1 = await roleService.createRole(ROLES.STUDENT);
		defaultRole2 = await roleService.createRole(ROLES.TEACHER);
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

		// 3. Roles - delete all since roles are global
		await dataSource.getRepository(RoleEntity).delete({});

		// Recrear roles por defecto
		defaultRole1 = await roleService.createRole(ROLES.STUDENT);
		defaultRole2 = await roleService.createRole(ROLES.TEACHER);

		jest.clearAllMocks();
	});

	describe('User Isolation', () => {
		test('should create users isolated by tenant', async () => {
			const userData: SignUpDto = {
				name: 'John',
				surname: 'Doe',
				email: 'john.doe@test.com',
				role: defaultRole1.name,
			};

			const userData2: SignUpDto = {
				name: 'Jane',
				surname: 'Smith',
				email: 'jane.smith@test.com',
				role: defaultRole2.name,
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
				role: defaultRole1.name,
			};

			await usersService.create(tenant1.id, userData);

			await expect(
				usersService.create(tenant1.id, {
					...userData,
					name: 'Jane',
				}),
			).rejects.toThrow(BadRequestException);
		});

		test('should find users only from specific tenant', async () => {
			await usersService.create(tenant1.id, {
				name: 'Alpha User 1',
				surname: 'One',
				email: 'user1@alpha.com',
				role: defaultRole1.name,
			});
			await usersService.create(tenant1.id, {
				name: 'Alpha User 2',
				surname: 'One',
				email: 'user2@alpha.com',
				role: defaultRole1.name,
			});
			await usersService.create(tenant2.id, {
				name: 'Beta User 1',
				surname: 'One',
				email: 'user1@beta.com',
				role: defaultRole2.name,
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
				role: defaultRole1.name,
			});

			// Intentar crear otro usuario con el mismo email en tenant2 debería fallar
			await expect(
				usersService.create(tenant2.id, {
					name: 'User in Tenant 2',
					surname: 'Two',
					email,
					role: defaultRole2.name,
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

	describe('Role Management', () => {
		test('should create roles globally', async () => {
			const role1 = await roleService.createRole(ROLES.ADMIN);
			const role2 = await roleService.createRole(ROLES.LIBRARIAN);

			expect(role1.name).toBe(ROLES.ADMIN);
			expect(role2.name).toBe(ROLES.LIBRARIAN);
		});

		test('should prevent duplicate role names globally', async () => {
			try {
				await roleService.createRole(ROLES.TEACHER);
				fail('Debería haber lanzado un error');
			} catch (error) {
				expect(error).toBeInstanceOf(BadRequestException);
				if (error instanceof BadRequestException) {
					expect(error.message).toBe('Role already exists');
				}
			}
		});

		test('should find all roles globally', async () => {
			await roleService.createRole(ROLES.ADMIN);
			await roleService.createRole(ROLES.LIBRARIAN);

			const allRoles = await roleService.findAllRoles();

			expect(allRoles.length).toBeGreaterThanOrEqual(2);
			expect(allRoles.some((role) => role.name === ROLES.ADMIN)).toBe(true);
			expect(allRoles.some((role) => role.name === ROLES.LIBRARIAN)).toBe(true);
		});

		test('should initialize default roles globally', async () => {
			const roles = await roleService.initializeDefaultRoles();

			expect(roles.length).toBeGreaterThanOrEqual(4);
			const roleNames = roles.map((r) => r.name);

			expect(roleNames).toContain(ROLES.ADMIN);
			expect(roleNames).toContain(ROLES.LIBRARIAN);
			expect(roleNames).toContain(ROLES.TEACHER);
			expect(roleNames).toContain(ROLES.STUDENT);
		});

		test('should get default roles', async () => {
			await dataSource.getRepository(RoleEntity).delete({});

			await roleService.initializeDefaultRoles();

			const defaultRoles = await roleService.getDefaultRoles(tenant1.id);

			expect(defaultRoles.length).toBeGreaterThanOrEqual(4);
			const roleNames = defaultRoles.map((r) => r.name);
			expect(roleNames).toContain(ROLES.ADMIN);
			expect(roleNames).toContain(ROLES.LIBRARIAN);
			expect(roleNames).toContain(ROLES.TEACHER);
			expect(roleNames).toContain(ROLES.STUDENT);
		});
	});

	describe('Cross-Entity Relationships', () => {
		test('should maintain proper relationships within tenant boundaries', async () => {
			await dataSource.getRepository(RoleEntity).delete({});

			const adminRole = await roleService.createRole(ROLES.ADMIN);

			const createdUser = await usersService.create(tenant1.id, {
				name: 'Admin User',
				email: 'admin@tenant1.com',
				role: adminRole.name,
				surname: 'User',
			});

			// Buscar el usuario con las relaciones cargadas para poder usar los métodos helper
			const userWithRelations =
				await usersService.findByEmail('admin@tenant1.com');

			expect(userWithRelations).toBeDefined();
			expect(userWithRelations?.getTenants()).toHaveLength(1);
			expect(userWithRelations?.getTenants()[0].id).toBe(tenant1.id);
		});
	});
});
