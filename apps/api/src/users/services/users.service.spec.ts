import {
	BadRequestException,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
// src/users/services/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { UserTenantEntity } from '../entities/user-tenant.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from './role.service';
import { UsersService } from './users.service';

// Mock de la librería bcrypt
jest.mock('bcrypt', () => ({
	hash: jest.fn(),
}));

// Definimos un tipo para nuestros repositorios mock
type MockRepository<T extends object = any> = Partial<
	Record<keyof Repository<T>, jest.Mock>
>;

// Función para crear un mock de repositorio con los métodos que necesitamos
const createMockRepository = (): MockRepository => {
	// Reuse a single queryBuilder mock so tests can inspect the same instance
	const qb = {
		where: jest.fn().mockReturnThis(),
		andWhere: jest.fn().mockReturnThis(),
		take: jest.fn().mockReturnThis(),
		getMany: jest.fn(),
	};

	return {
		findOne: jest.fn(),
		find: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		softDelete: jest.fn(),
		count: jest.fn(),
		// Mock del QueryBuilder para el método search — siempre devuelve la misma instancia
		createQueryBuilder: jest.fn(() => qb),
	};
};
const mockRoleService = {
	findById: jest.fn(),
};

describe('UsersService', () => {
	let service: UsersService;
	let usersRepo: MockRepository<UserEntity>;
	let userTenantsRepo: MockRepository<UserTenantEntity>;

	const mockUser = new UserEntity();
	mockUser.id = 1;
	mockUser.email = 'test@example.com';
	mockUser.name = 'Test';
	mockUser.surname = 'User';

	const mockRole = new RoleEntity();
	mockRole.id = 1;
	mockRole.name = ROLES.ADMIN;

	const mockUserTenant = new UserTenantEntity();
	mockUserTenant.id = 1;
	mockUserTenant.user_id = 1;
	mockUserTenant.tenant_id = 1;
	mockUserTenant.role_id = 1;
	mockUserTenant.is_active = true;
	mockUserTenant.role = mockRole;
	mockUserTenant.user = mockUser;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(UserEntity),
					useValue: createMockRepository(),
				},
				{
					provide: getRepositoryToken(UserTenantEntity),
					useValue: createMockRepository(),
				},
				{
					provide: RoleService,
					useValue: mockRoleService,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		usersRepo = module.get(getRepositoryToken(UserEntity));
		userTenantsRepo = module.get(getRepositoryToken(UserTenantEntity));

		// Limpiar mocks entre tests
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// ============================================
	// BÚSQUEDA DE USUARIOS
	// ============================================

	describe('findByEmail', () => {
		it('should find a user by email', async () => {
			usersRepo.findOne?.mockResolvedValue(mockUser);
			const result = await service.findByEmail('test@example.com');
			expect(usersRepo.findOne).toHaveBeenCalledWith({
				where: { email: 'test@example.com', deleted_at: IsNull() },
				relations: ['userTenants', 'userTenants.tenant', 'userTenants.role'],
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null if user not found', async () => {
			usersRepo.findOne?.mockResolvedValue(null);
			const result = await service.findByEmail('notfound@example.com');
			expect(result).toBeNull();
		});
	});

	describe('findById', () => {
		it('should find a user by ID', async () => {
			usersRepo.findOne?.mockResolvedValue(mockUser);
			const result = await service.findById(1);
			expect(usersRepo.findOne).toHaveBeenCalledWith({
				where: { id: 1, deleted_at: IsNull() },
				relations: ['userTenants', 'userTenants.tenant', 'userTenants.role'],
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null if user not found', async () => {
			usersRepo.findOne?.mockResolvedValue(null);
			const result = await service.findById(99);
			expect(result).toBeNull();
		});
	});

	describe('hasAccessToTenant', () => {
		it('should return true if user has access', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(mockUserTenant);
			const result = await service.hasAccessToTenant(1, 1);
			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: 1, tenant_id: 1, is_active: true },
			});
			expect(result).toBe(true);
		});

		it('should return false if user has no access', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(null);
			const result = await service.hasAccessToTenant(1, 1);
			expect(result).toBe(false);
		});
	});

	describe('getRoleInTenant', () => {
		it('should return the role in tenant', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(mockUserTenant);
			const result = await service.getRoleInTenant(1, 1);
			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: 1, tenant_id: 1, is_active: true },
				relations: ['role'],
			});
			expect(result).toEqual(mockRole);
		});

		it('should return null if user not in tenant', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(null);
			const result = await service.getRoleInTenant(1, 1);
			expect(result).toBeNull();
		});

		it('should return null if relation exists but has no role', async () => {
			const utWithoutRole = { ...mockUserTenant, role: null };
			userTenantsRepo.findOne?.mockResolvedValue(utWithoutRole);
			const result = await service.getRoleInTenant(1, 1);
			expect(result).toBeNull();
		});
	});

	describe('getUserTenants', () => {
		it('should return user tenants ordered by creation date', async () => {
			userTenantsRepo.find?.mockResolvedValue([mockUserTenant]);
			const result = await service.getUserTenants(1);
			expect(userTenantsRepo.find).toHaveBeenCalledWith({
				where: { user_id: 1, is_active: true },
				relations: ['tenant', 'role'],
				order: { created_at: 'ASC' },
			});
			expect(result).toEqual([mockUserTenant]);
		});
	});

	describe('findAllByTenant', () => {
		it('should return users in a tenant with their role attached', async () => {
			userTenantsRepo.find?.mockResolvedValue([mockUserTenant]);
			const result = await service.findAllByTenant(1);

			expect(userTenantsRepo.find).toHaveBeenCalledWith({
				where: { tenant_id: 1, is_active: true },
				relations: ['user', 'role'],
			});

			// Verifica que el rol se adjuntó correctamente
			expect(result[0]).toEqual(mockUser);
			expect((result[0] as any).currentRole).toEqual(mockRole);
			expect((result[0] as any).currentRoleId).toEqual(mockRole.id);
		});
	});

	// ============================================
	// CREAR USUARIOS
	// ============================================

	describe('create', () => {
		const createData = {
			email: 'new@example.com',
			name: 'New',
			surname: 'User',
			password: 'password123',
			tenantId: 1,
			roleId: 1,
		};

		// Mock para el findById que se llama al final
		const setupFinalFindByIdMock = () => {
			jest
				.spyOn(service, 'findById')
				.mockImplementation(async (id: number): Promise<UserEntity> => {
					return { ...mockUser, id } as UserEntity;
				});
		};

		it('should create a new user and add them to a tenant', async () => {
			setupFinalFindByIdMock();

			// 0. Mock role validation
			mockRoleService.findById.mockResolvedValue(mockRole);
			// 1. Email check fails
			usersRepo.findOne?.mockResolvedValue(null);
			// 2. Create new user
			const newUser = { ...mockUser, id: 2, ...createData };
			usersRepo.save?.mockResolvedValue(newUser);
			// 3. addUserToTenant (check fails)
			userTenantsRepo.findOne?.mockResolvedValue(null);
			// 4. addUserToTenant (save)
			userTenantsRepo.save?.mockResolvedValue(mockUserTenant);

			const result = await service.create(createData.tenantId, createData);

			expect(usersRepo.findOne).toHaveBeenCalledWith({
				where: { email: createData.email },
			});
			expect(usersRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({ email: createData.email }),
			);
			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: newUser.id, tenant_id: createData.tenantId },
			});
			expect(userTenantsRepo.save).toHaveBeenCalled();
			expect(result.user.id).toBe(newUser.id);
		});

		it('should throw BadRequestException when user exists globally', async () => {
			setupFinalFindByIdMock();

			// 0. Mock role validation
			mockRoleService.findById.mockResolvedValue(mockRole);
			// 1. Email check finds user
			const existingUserWithMethod = {
				...mockUser,
				hasAccessToTenant: jest.fn().mockReturnValue(false),
			};
			usersRepo.findOne?.mockResolvedValue(existingUserWithMethod);

			await expect(
				service.create(createData.tenantId, {
					...createData,
					email: mockUser.email,
				}),
			).rejects.toThrow(BadRequestException);
			expect(usersRepo.findOne).toHaveBeenCalledWith({
				where: { email: mockUser.email },
			});
			expect(usersRepo.save).not.toHaveBeenCalled(); // No debe crear usuario
			expect(userTenantsRepo.save).not.toHaveBeenCalled(); // create() no agrega el usuario a tenant cuando existe
		});

		it('should throw ConflictException if user already exists in this tenant', async () => {
			// 0. Mock role validation
			mockRoleService.findById.mockResolvedValue(mockRole);
			// 1. Email check finds user
			const existingUserWithMethod = {
				...mockUser,
				hasAccessToTenant: jest.fn().mockReturnValue(true),
			};
			usersRepo.findOne?.mockResolvedValue(existingUserWithMethod);

			await expect(
				service.create(createData.tenantId, {
					...createData,
					email: mockUser.email,
				}),
			).rejects.toThrow(
				new ConflictException('User already exists in this tenant'),
			);
		});
	});

	describe('createGlobalUser', () => {
		const globalData = {
			email: 'global@admin.com',
			name: 'Global',
			surname: 'Admin',
			password: 'password123',
			roleId: 99,
		};

		it('should create a new global user', async () => {
			// Mock findByEmail to return null first (check), then return the saved user
			const savedUser = { ...mockUser, ...globalData } as unknown as UserEntity;
			const spy = jest
				.spyOn(service, 'findByEmail')
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(savedUser);
			usersRepo.save?.mockResolvedValue(savedUser);

			const result = await service.createGlobalUser(globalData);

			expect(spy).toHaveBeenCalledWith(globalData.email);
			expect(usersRepo.save).toHaveBeenCalledWith({
				email: globalData.email,
				name: globalData.name,
				surname: globalData.surname,
				password: expect.any(String),
			});
			expect(result.user.email).toBe(globalData.email);
		});

		it('should throw ConflictException if email already exists', async () => {
			jest.spyOn(service, 'findByEmail').mockResolvedValue(mockUser);

			await expect(service.createGlobalUser(globalData)).rejects.toThrow(
				new ConflictException('Email already exists'),
			);
		});
	});

	// ============================================
	// GESTIÓN DE TENANTS
	// ============================================

	describe('addUserToTenant', () => {
		it('should create a new user-tenant relation', async () => {
			// 1. Check fails
			userTenantsRepo.findOne?.mockResolvedValue(null);
			// 2. Save new relation
			userTenantsRepo.save?.mockResolvedValue(mockUserTenant);

			const result = await service.addUserToTenant(1, 1, 1);

			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: 1, tenant_id: 1 },
			});
			expect(userTenantsRepo.save).toHaveBeenCalledWith({
				user_id: 1,
				tenant_id: 1,
				role_id: 1,
				is_active: true,
			});
			expect(result).toEqual(mockUserTenant);
		});

		it('should reactivate an inactive relation with the new role', async () => {
			const inactiveRelation = {
				...mockUserTenant,
				is_active: false,
				role_id: 99,
			};
			// 1. Check finds inactive relation
			userTenantsRepo.findOne?.mockResolvedValue(inactiveRelation);
			// 2. Save (reactivate)
			userTenantsRepo.save?.mockResolvedValue({
				...inactiveRelation,
				is_active: true,
				role_id: 1,
			});

			const result = await service.addUserToTenant(1, 1, 1); // new roleId is 1

			expect(userTenantsRepo.findOne).toHaveBeenCalled();
			expect(userTenantsRepo.save).toHaveBeenCalledWith({
				...inactiveRelation,
				is_active: true,
				role_id: 1, // Verifica que el rol se actualiza
			});
			expect(result.is_active).toBe(true);
			expect(result.role_id).toBe(1);
		});

		it('should throw ConflictException if relation is already active', async () => {
			// 1. Check finds active relation
			userTenantsRepo.findOne?.mockResolvedValue(mockUserTenant);

			await expect(service.addUserToTenant(1, 1, 1)).rejects.toThrow(
				new ConflictException('User already in this tenant'),
			);
		});
	});

	describe('removeUserFromTenant', () => {
		it('should set is_active to false', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(mockUserTenant);
			userTenantsRepo.save?.mockResolvedValue(undefined); // save no devuelve nada importante aquí

			await service.removeUserFromTenant(1, 1);

			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: 1, tenant_id: 1 },
			});
			expect(userTenantsRepo.save).toHaveBeenCalledWith({
				...mockUserTenant,
				is_active: false,
			});
		});

		it('should throw NotFoundException if relation does not exist', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(null);

			await expect(service.removeUserFromTenant(1, 1)).rejects.toThrow(
				new NotFoundException('User not found in this tenant'),
			);
		});
	});

	describe('changeRoleInTenant', () => {
		it('should update the role_id', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(mockUserTenant);
			userTenantsRepo.save?.mockResolvedValue({ ...mockUserTenant, role_id: 2 });

			const newRoleId = 2;
			const result = await service.changeRoleInTenant(1, 1, newRoleId);

			expect(userTenantsRepo.findOne).toHaveBeenCalledWith({
				where: { user_id: 1, tenant_id: 1, is_active: true },
			});
			expect(userTenantsRepo.save).toHaveBeenCalledWith({
				...mockUserTenant,
				role_id: newRoleId,
			});
			expect(result.role_id).toBe(newRoleId);
		});

		it('should throw NotFoundException if active relation not found', async () => {
			userTenantsRepo.findOne?.mockResolvedValue(null);

			await expect(service.changeRoleInTenant(1, 1, 2)).rejects.toThrow(
				new NotFoundException('User not found in this tenant'),
			);
		});
	});

	// ============================================
	// ACTUALIZAR / ELIMINAR
	// ============================================

	describe('update', () => {
		const updateData = { name: 'Updated' };

		// Mock para el findById
		const setupFindByIdMocks = (initialUser, updatedUser) => {
			jest
				.spyOn(service, 'findById')
				.mockResolvedValueOnce(initialUser) // Primera llamada (check)
				.mockResolvedValueOnce(updatedUser); // Segunda llamada (return)
		};

		it('should update user data', async () => {
			const updatedUser = { ...mockUser, ...updateData };
			setupFindByIdMocks(mockUser, updatedUser);

			usersRepo.update?.mockResolvedValue(undefined);

			const findByEmailSpy = jest.spyOn(service, 'findByEmail');
			const result = await service.update(1, updateData);

			expect(service.findById).toHaveBeenCalledWith(1);
			expect(usersRepo.update).toHaveBeenCalledWith(1, updateData);
			expect(result).toEqual(updatedUser);
			// Ensure findByEmail was not invoked since email wasn't part of the update
			expect(findByEmailSpy).not.toHaveBeenCalled();
		});

		it('should update user data and email if available', async () => {
			const emailUpdateData = { email: 'new@example.com' };
			const updatedUser = { ...mockUser, ...emailUpdateData };
			setupFindByIdMocks(mockUser, updatedUser);

			// Mock para la comprobación de email
			jest.spyOn(service, 'findByEmail').mockResolvedValue(null);
			usersRepo.update?.mockResolvedValue(undefined);

			const result = await service.update(1, emailUpdateData);

			expect(service.findById).toHaveBeenCalledWith(1);
			expect(service.findByEmail).toHaveBeenCalledWith(emailUpdateData.email);
			expect(usersRepo.update).toHaveBeenCalledWith(1, emailUpdateData);
			expect(result).toEqual(updatedUser);
		});

		it('should throw ConflictException if new email is taken', async () => {
			const emailUpdateData = { email: 'taken@example.com' };
			const anotherUser = { ...mockUser, id: 2, email: 'taken@example.com' };

			jest.spyOn(service, 'findById').mockResolvedValueOnce(mockUser);
			jest
				.spyOn(service, 'findByEmail')
				.mockResolvedValue(anotherUser as UserEntity);

			await expect(service.update(1, emailUpdateData)).rejects.toThrow(
				new ConflictException('Email already exists'),
			);
		});

		it('should throw NotFoundException if user not found', async () => {
			jest.spyOn(service, 'findById').mockResolvedValue(null);

			await expect(service.update(1, updateData)).rejects.toThrow(
				new NotFoundException('User not found'),
			);
		});
	});

	describe('updatePassword', () => {
		it('should hash and update the password', async () => {
			const hashedPassword = 'hashedPassword123';
			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
			usersRepo.update?.mockResolvedValue(undefined);

			await service.updatePassword(1, 'newPass');

			expect(bcrypt.hash).toHaveBeenCalledWith('newPass', 10);
			expect(usersRepo.update).toHaveBeenCalledWith(1, {
				password: hashedPassword,
			});
		});
	});

	describe('delete', () => {
		it('should soft delete user and deactivate tenant relations', async () => {
			jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
			userTenantsRepo.update?.mockResolvedValue(undefined);
			usersRepo.softDelete?.mockResolvedValue(undefined);

			await service.delete(1);

			expect(service.findById).toHaveBeenCalledWith(1);
			expect(userTenantsRepo.update).toHaveBeenCalledWith(
				{ user_id: 1 },
				{ is_active: false },
			);
			expect(usersRepo.softDelete).toHaveBeenCalledWith(1);
		});

		it('should throw NotFoundException if user not found', async () => {
			jest.spyOn(service, 'findById').mockResolvedValue(null);

			await expect(service.delete(1)).rejects.toThrow(
				new NotFoundException('User not found'),
			);
		});
	});

	// ============================================
	// HELPERS
	// ============================================

	describe('emailExists', () => {
		it('should return true if email count > 0', async () => {
			usersRepo.count?.mockResolvedValue(1);
			const result = await service.emailExists('test@example.com');
			expect(usersRepo.count).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			});
			expect(result).toBe(true);
		});

		it('should return false if email count === 0', async () => {
			usersRepo.count?.mockResolvedValue(0);
			const result = await service.emailExists('test@example.com');
			expect(result).toBe(false);
		});
	});

	describe('search', () => {
		it('should build and execute the search query', async () => {
			// Replace repository's createQueryBuilder to return a stable mock object that we can assert on
			const query = 'Test';
			const qb = {
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				take: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([mockUser]),
			} as any;

			(usersRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

			const result = await service.search(query, 10);

			expect(usersRepo.createQueryBuilder).toHaveBeenCalledWith('user');
			expect(qb.where).toHaveBeenCalledWith(
				'user.name ILIKE :query OR user.surname ILIKE :query OR user.email ILIKE :query',
				{ query: `%${query}%` },
			);
			expect(qb.andWhere).toHaveBeenCalledWith('user.deleted_at IS NULL');
			expect(qb.take).toHaveBeenCalledWith(10);
			expect(qb.getMany).toHaveBeenCalled();
			expect(result).toEqual([mockUser]);
		});
	});

	describe('countByTenant', () => {
		it('should return the count of active users in a tenant', async () => {
			userTenantsRepo.count?.mockResolvedValue(5);
			const result = await service.countByTenant(1);
			expect(userTenantsRepo.count).toHaveBeenCalledWith({
				where: { tenant_id: 1, is_active: true },
			});
			expect(result).toBe(5);
		});
	});

	describe('getTenantUserStats', () => {
		it('should return total count and stats by role', async () => {
			const mockRoleUser = { ...mockRole, name: 'USER' };
			const userTenantsList = [
				{ ...mockUserTenant, role: mockRole }, // Admin
				{ ...mockUserTenant, id: 2, role: mockRole }, // Admin
				{ ...mockUserTenant, id: 3, role: mockRoleUser }, // User
			];
			userTenantsRepo.find?.mockResolvedValue(userTenantsList);

			const result = await service.getTenantUserStats(1);

			expect(userTenantsRepo.find).toHaveBeenCalledWith({
				where: { tenant_id: 1, is_active: true },
				relations: ['role'],
			});

			expect(result).toEqual({
				total: 3,
				by_role: {
					ADMIN: 2,
					USER: 1,
				},
			});
		});
	});
});
