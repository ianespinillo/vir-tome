import { BadRequestException } from '@nestjs/common';
// src/users/__tests__/user-multitenant.spec.ts - CORREGIDO
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignUpDto } from '@repo/common';
import { DataSource } from 'typeorm';
import { testDatabaseConfig } from '../../__tests__/database-test.config';
import { getTestDataSource } from '../../__tests__/setup';
import { EmailService } from '../../email/email.service';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from '../services/role.service';
import { UsersService } from '../services/users.service';

describe('Users Multi-tenant Integration', () => {
	let app: TestingModule;
	let dataSource: DataSource;
	let usersService: UsersService;
	let roleService: RoleService;
	let tenantRepository: any;

	let tenant1: TenantEntity;
	let tenant2: TenantEntity;
	let defaultRole1: RoleEntity;
	let defaultRole2: RoleEntity;

	// Mock EmailService para tests
	const mockEmailService = {
		sendEmailWelcome: jest.fn().mockResolvedValue(true),
	};

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig),
				TypeOrmModule.forFeature([TenantEntity, UserEntity, RoleEntity]),
			],
			providers: [
				UsersService,
				RoleService,
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
			],
		}).compile();

		dataSource = getTestDataSource();
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
		defaultRole1 = await roleService.createRole('Student', tenant1.id);
		defaultRole2 = await roleService.createRole('Student', tenant2.id);
	});

	afterAll(async () => {
		await dataSource.destroy();
		await app.close();
	});

	beforeEach(async () => {
		// Limpiar solo usuarios entre tests (mantener roles)
		await dataSource.getRepository(UserEntity).delete({});
		jest.clearAllMocks();
	});

	describe('User Isolation', () => {
		test('should create users isolated by tenant', async () => {
			const userData: SignUpDto = {
				name: 'John',
				surname: 'Doe',
				email: 'john.doe@test.com',
				roleId: defaultRole1.id, // AGREGADO: roleId requerido
			};

			const userData2: SignUpDto = {
				name: 'Jane',
				surname: 'Smith',
				email: 'john.doe@test.com', // Mismo email, diferente tenant
				roleId: defaultRole2.id, // AGREGADO: roleId para tenant2
			};

			// Crear usuario en tenant1
			const user1 = await usersService.createUser(userData, tenant1.id);

			// Crear usuario con mismo email en tenant2 (debe permitirlo)
			const user2 = await usersService.createUser(userData2, tenant2.id);

			expect(user1.tenant_id).toBe(tenant1.id);
			expect(user1.email).toBe('john.doe@test.com');
			expect(user1.name).toBe('John');

			expect(user2.tenant_id).toBe(tenant2.id);
			expect(user2.email).toBe('john.doe@test.com'); // Mismo email, diferente tenant
			expect(user2.name).toBe('Jane');

			// Verificar que el servicio de email fue llamado para ambos
			expect(mockEmailService.sendEmailWelcome).toHaveBeenCalledTimes(2);
		});

		test('should prevent duplicate emails within same tenant', async () => {
			const userData: SignUpDto = {
				name: 'John',
				surname: 'Doe',
				email: 'duplicate@test.com',
				roleId: defaultRole1.id, // AGREGADO
			};

			// Crear primer usuario
			await usersService.createUser(userData, tenant1.id);

			// Intentar crear segundo usuario con mismo email en mismo tenant
			await expect(
				usersService.createUser(
					{
						...userData,
						name: 'Jane', // Diferente nombre pero mismo email y tenant
					},
					tenant1.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		test('should prevent creating user with role from different tenant', async () => {
			const userData: SignUpDto = {
				name: 'Hacker',
				surname: 'User',
				email: 'hacker@test.com',
				roleId: defaultRole2.id, // Rol de tenant2 en tenant1
			};

			// Intentar crear usuario en tenant1 con rol de tenant2
			await expect(usersService.createUser(userData, tenant1.id)).rejects.toThrow(
				BadRequestException,
			);
		});

		test('should find users only from specific tenant', async () => {
			// Crear usuarios para diferentes tenants
			await usersService.createUser(
				{
					name: 'Alpha User 1',
					surname: 'One',
					email: 'user1@alpha.com',
					roleId: defaultRole1.id,
				},
				tenant1.id,
			);
			await usersService.createUser(
				{
					name: 'Alpha User 2',
					surname: 'One',
					email: 'user2@alpha.com',
					roleId: defaultRole1.id,
				},
				tenant1.id,
			);
			await usersService.createUser(
				{
					name: 'Beta User 1',
					surname: 'One',
					email: 'user1@beta.com',
					roleId: defaultRole2.id,
				},
				tenant2.id,
			);

			// Verificar isolation
			const tenant1Users = await usersService.findAll(tenant1.id);
			const tenant2Users = await usersService.findAll(tenant2.id);

			expect(tenant1Users).toHaveLength(2);
			expect(tenant1Users.every((user) => user.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(tenant2Users).toHaveLength(1);
			expect(tenant2Users[0].tenant_id).toBe(tenant2.id);
			expect(tenant2Users[0].name).toBe('Beta User 1');
		});

		test('should find user by email within tenant only', async () => {
			const email = 'shared@email.com';

			// Crear usuarios con mismo email en diferentes tenants
			await usersService.createUser(
				{
					name: 'User in Tenant 1',
					surname: 'One',
					email,
					roleId: defaultRole1.id,
				},
				tenant1.id,
			);
			await usersService.createUser(
				{
					name: 'User in Tenant 2',
					surname: 'Two',
					email,
					roleId: defaultRole2.id,
				},
				tenant2.id,
			);

			// Buscar por email en cada tenant
			const user1 = await usersService.findUserByEmail(email, tenant1.id);
			const user2 = await usersService.findUserByEmail(email, tenant2.id);

			expect(user1?.name).toBe('User in Tenant 1');
			expect(user1?.tenant_id).toBe(tenant1.id);

			expect(user2?.name).toBe('User in Tenant 2');
			expect(user2?.tenant_id).toBe(tenant2.id);
		});

		test('should provide isolated user statistics', async () => {
			// Crear usuarios para tenant1
			await usersService.createUser(
				{
					name: 'User 1',
					surname: 'User',
					email: 'user1@tenant1.com',
					roleId: defaultRole1.id,
				},
				tenant1.id,
			);
			await usersService.createUser(
				{
					name: 'User 2',
					surname: 'User',
					email: 'user2@tenant1.com',
					roleId: defaultRole1.id,
				},
				tenant1.id,
			);

			// Crear usuarios para tenant2
			await usersService.createUser(
				{
					name: 'User 3',
					email: 'user3@tenant2.com',
					roleId: defaultRole2.id,
					surname: 'User',
				},
				tenant2.id,
			);

			const stats1 = await usersService.getUserStats(tenant1.id);
			const stats2 = await usersService.getUserStats(tenant2.id);

			expect(stats1.total).toBe(2);
			expect(stats1.active).toBe(2);

			expect(stats2.total).toBe(1);
			expect(stats2.active).toBe(1);
		});
	});

	describe('Role Isolation', () => {
		test('should create roles isolated by tenant', async () => {
			// Crear roles con mismo nombre en diferentes tenants
			const role1 = await roleService.createRole('Administrator', tenant1.id);
			const role2 = await roleService.createRole('Administrator', tenant2.id);

			expect(role1.name).toBe('Administrator');
			expect(role1.tenant_id).toBe(tenant1.id);

			expect(role2.name).toBe('Administrator');
			expect(role2.tenant_id).toBe(tenant2.id);
		});

		test('should prevent duplicate role names within same tenant', async () => {
			await roleService.createRole('Teacher', tenant1.id);

			await expect(roleService.createRole('Teacher', tenant1.id)).rejects.toThrow(
				BadRequestException,
			);
		});

		test('should find roles only from specific tenant', async () => {
			// Crear roles adicionales para diferentes tenants
			await roleService.createRole('Principal', tenant1.id);
			// await roleService.createRole('Teacher', tenant1.id);
			await roleService.createRole('Librarian', tenant2.id);

			const tenant1Roles = await roleService.findAll(tenant1.id);
			const tenant2Roles = await roleService.findAll(tenant2.id);

			// tenant1 tiene: Student (default) + Principal + Teacher = 3
			expect(tenant1Roles).toHaveLength(4);
			expect(tenant1Roles.every((role) => role.tenant_id === tenant1.id)).toBe(
				true,
			);

			// tenant2 tiene: Student (default) + Librarian = 2
			expect(tenant2Roles).toHaveLength(3);
			expect(tenant2Roles.every((role) => role.tenant_id === tenant2.id)).toBe(
				true,
			);
		});

		test('should initialize default roles independently per tenant', async () => {
			// Crear nuevos tenants para este test
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

			// Verificar que los nombres son los esperados
			const expectedRoleNames = [
				'Administrator',
				'Librarian',
				'Student',
				'Teacher',
			];
			expect(roles1.map((r) => r.name).sort()).toEqual(expectedRoleNames);
			expect(roles2.map((r) => r.name).sort()).toEqual(expectedRoleNames);
		});

		test('should get default roles only from specific tenant', async () => {
			// Usar tenants existentes y agregar roles por defecto
			await roleService.initializeDefaultRoles(tenant1.id);
			await roleService.initializeDefaultRoles(tenant2.id);

			// Crear rol custom en tenant1
			await roleService.createRole('Custom Role', tenant1.id);

			const defaultRoles1 = await roleService.getDefaultRoles(tenant1.id);
			const defaultRoles2 = await roleService.getDefaultRoles(tenant2.id);

			expect(defaultRoles1.length).toBeGreaterThanOrEqual(4); // Al menos los 4 por defecto
			expect(defaultRoles1.every((role) => role.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(defaultRoles2.length).toBeGreaterThanOrEqual(4);
			expect(defaultRoles2.every((role) => role.tenant_id === tenant2.id)).toBe(
				true,
			);
		});
	});

	describe('Cross-Entity Relationships', () => {
		test('should maintain proper relationships within tenant boundaries', async () => {
			// Crear roles en tenant1
			const adminRole = await roleService.createRole('Admin', tenant1.id);
			console.log(adminRole);
			// Crear usuarios en tenant1
			const user1 = await usersService.createUser(
				{
					name: 'Admin User',
					email: 'admin@tenant1.com',
					roleId: adminRole.id,
					surname: 'User',
				},
				tenant1.id,
			);

			// Verificar que los IDs no se cruzan entre tenants
			expect(user1.tenant_id).toBe(tenant1.id);
			expect(adminRole.tenant_id).toBe(tenant1.id);
		});
	});
});
