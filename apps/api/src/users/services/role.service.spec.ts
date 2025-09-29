import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../entities/role.entity';
import { RoleService } from './role.service';

describe('RoleService', () => {
	let service: RoleService;
	let repository: Repository<RoleEntity>;

	const mockRepository = {
		findOne: jest.fn(),
		find: jest.fn(),
		findAndCount: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		createQueryBuilder: jest.fn(),
	};

	// Mock TypeORM operators
	jest.mock('typeorm', () => {
		const actual = jest.requireActual('typeorm');
		return {
			...actual,
			In: jest.fn((values) => ({ _type: 'in', _value: values })),
			IsNull: jest.fn().mockReturnValue({ _type: 'isNull' }),
		};
	});

	const mockTenantId = 1;
	const mockTenant: TenantEntity = {
		id: mockTenantId,
		subdomain: 'test-tenant',
		name: 'Test Tenant',
		contact_email: 'admin@test-tenant.com',
		is_active: true,
		is_demo: false,
		settings: undefined,
		plan: 'basic',
		subscription_expires_at: undefined,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: undefined,
		isActiveAndValid: jest.fn().mockReturnValue(true),
		canAddResource: jest.fn().mockReturnValue(true),
	};

	const mockRole: RoleEntity = {
		id: 1,
		name: 'Administrator',
		tenant_id: mockTenantId,
		tenant: mockTenant,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: undefined,
		users: [],
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoleService,
				{
					provide: getRepositoryToken(RoleEntity),
					useValue: mockRepository,
				},
			],
		}).compile();

		service = module.get<RoleService>(RoleService);
		repository = module.get<Repository<RoleEntity>>(
			getRepositoryToken(RoleEntity),
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createRole', () => {
		const roleName = 'Test Role';

		it('should create a role successfully', async () => {
			mockRepository.findOne.mockResolvedValue(null); // Role doesn't exist
			mockRepository.create.mockReturnValue(mockRole);
			mockRepository.save.mockResolvedValue(mockRole);

			const result = await service.createRole(roleName, mockTenantId);

			expect(result).toEqual(mockRole);
			expect(mockRepository.findOne).toHaveBeenCalledWith({
				where: {
					name: roleName,
					tenant_id: mockTenantId,
					deleted_at: null,
				},
			});
			expect(mockRepository.create).toHaveBeenCalledWith({
				name: roleName,
				tenant_id: mockTenantId,
			});
			expect(mockRepository.save).toHaveBeenCalledWith(mockRole);
		});

		it('should throw BadRequestException if role already exists', async () => {
			mockRepository.findOne.mockResolvedValue(mockRole);

			await expect(service.createRole(roleName, mockTenantId)).rejects.toThrow(
				new BadRequestException('Role already exists'),
			);

			expect(mockRepository.findOne).toHaveBeenCalledWith({
				where: {
					name: roleName,
					tenant_id: mockTenantId,
					deleted_at: null,
				},
			});
			expect(mockRepository.save).not.toHaveBeenCalled();
		});

		it('should handle database errors during creation', async () => {
			mockRepository.findOne.mockResolvedValue(null);
			mockRepository.create.mockReturnValue(mockRole);
			mockRepository.save.mockRejectedValue(new Error('Database error'));

			await expect(service.createRole(roleName, mockTenantId)).rejects.toThrow(
				new BadRequestException('Database error'),
			);
		});

		it('should handle non-Error exceptions during creation', async () => {
			mockRepository.findOne.mockResolvedValue(null);
			mockRepository.create.mockReturnValue(mockRole);
			mockRepository.save.mockRejectedValue('String error');

			await expect(service.createRole(roleName, mockTenantId)).rejects.toBe(
				'String error',
			);
		});
	});

	describe('findRoleByName', () => {
		const roleName = 'Administrator';

		it('should find role by name successfully', async () => {
			mockRepository.findOne.mockResolvedValue(mockRole);

			const result = await service.findRoleByName(roleName, mockTenantId);

			expect(result).toEqual(mockRole);
			expect(mockRepository.findOne).toHaveBeenCalledWith({
				where: {
					name: roleName,
					tenant_id: mockTenantId,
					deleted_at: null,
				},
			});
		});

		it('should return null if role not found', async () => {
			mockRepository.findOne.mockResolvedValue(null);

			const result = await service.findRoleByName('NonExistent', mockTenantId);

			expect(result).toBeNull();
		});
	});

	describe('findAllRoles', () => {
		const mockRoles = [
			{ ...mockRole, id: 1, name: 'Administrator' },
			{ ...mockRole, id: 2, name: 'Librarian' },
			{ ...mockRole, id: 3, name: 'Teacher' },
		];

		it('should return all roles for tenant', async () => {
			mockRepository.find.mockResolvedValue(mockRoles);

			const result = await service.findAllRoles(mockTenantId);

			expect(result).toEqual(mockRoles);
			expect(mockRepository.find).toHaveBeenCalledWith({
				where: {
					tenant_id: mockTenantId,
					deleted_at: null,
				},
				order: { id: 'ASC' },
			});
		});

		it('should return empty array if no roles found', async () => {
			mockRepository.find.mockResolvedValue([]);

			const result = await service.findAllRoles(mockTenantId);

			expect(result).toEqual([]);
		});
	});

	describe('initializeDefaultRoles', () => {
		const defaultRoles = [
			{ name: 'Administrator' },
			{ name: 'Librarian' },
			{ name: 'Teacher' },
			{ name: 'Student' },
		];

		it('should initialize all default roles when none exist', async () => {
			const createdRoles = defaultRoles.map((role, index) => ({
				...mockRole,
				id: index + 1,
				name: role.name,
			}));

			// Mock that no roles exist initially
			mockRepository.findOne.mockResolvedValue(null);
			mockRepository.create.mockImplementation((data) => data);
			mockRepository.save.mockImplementation((data) => Promise.resolve(data));

			// Mock the createRole method behavior
			jest.spyOn(service, 'createRole').mockImplementation(async (name) => {
				const role = createdRoles.find((r) => r.name === name);
				return Promise.resolve(role as RoleEntity);
			});

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(service.createRole).toHaveBeenCalledTimes(4);
			expect(result.map((r) => r.name)).toEqual([
				'Administrator',
				'Librarian',
				'Teacher',
				'Student',
			]);
		});

		it('should handle existing roles and return them', async () => {
			const existingRole = { ...mockRole, name: 'Administrator' };

			// Mock createRole to throw for first role, then return existing
			jest
				.spyOn(service, 'createRole')
				.mockRejectedValueOnce(new BadRequestException('Role already exists'))
				.mockImplementation(async (name) => {
					return Promise.resolve({
						...mockRole,
						name,
					} as RoleEntity);
				});

			// Mock findOne to return existing role
			mockRepository.findOne.mockResolvedValue(existingRole);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual(existingRole);
		});

		it('should handle mixed scenario of existing and new roles', async () => {
			const existingAdminRole = { ...mockRole, name: 'Administrator' };

			// Mock createRole behavior: first fails (exists), others succeed
			jest
				.spyOn(service, 'createRole')
				.mockRejectedValueOnce(new Error('Role already exists'))
				.mockResolvedValueOnce({
					...mockRole,
					id: 2,
					name: 'Librarian',
				} as RoleEntity)
				.mockResolvedValueOnce({
					...mockRole,
					id: 3,
					name: 'Teacher',
				} as RoleEntity)
				.mockResolvedValueOnce({
					...mockRole,
					id: 4,
					name: 'Student',
				} as RoleEntity);

			// Mock findOne to return existing role only for Administrator
			mockRepository.findOne.mockResolvedValue(existingAdminRole);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual(existingAdminRole);
		});

		it('should skip roles that fail to create and cannot be found', async () => {
			// Mock createRole to fail for all roles
			jest
				.spyOn(service, 'createRole')
				.mockRejectedValue(new Error('Creation failed'));

			// Mock findOne to return null (role not found)
			mockRepository.findOne.mockResolvedValue(null);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(0);
		});
	});

	describe('getDefaultRoles', () => {
		const defaultRoleNames = ['Administrator', 'Librarian', 'Teacher', 'Student'];
		const mockDefaultRoles = defaultRoleNames.map((name, index) => ({
			...mockRole,
			id: index + 1,
			name,
		}));

		it('should return all default roles', async () => {
			mockRepository.find.mockResolvedValue(mockDefaultRoles);

			const result = await service.getDefaultRoles(mockTenantId);

			expect(result).toEqual(mockDefaultRoles);
			expect(mockRepository.find).toHaveBeenCalledWith({
				where: {
					name: In(defaultRoleNames),
					tenant_id: mockTenantId,
					deleted_at: null,
				},
			});
		});

		it('should return empty array if no default roles found', async () => {
			mockRepository.find.mockResolvedValue([]);

			const result = await service.getDefaultRoles(mockTenantId);

			expect(result).toEqual([]);
		});

		it('should return partial default roles if only some exist', async () => {
			const partialRoles = mockDefaultRoles.slice(0, 2);
			mockRepository.find.mockResolvedValue(partialRoles);

			const result = await service.getDefaultRoles(mockTenantId);

			expect(result).toEqual(partialRoles);
			expect(result).toHaveLength(2);
		});
	});

	describe('inherited methods from MultiTenantService', () => {
		describe('findById', () => {
			it('should find role by id and tenant', async () => {
				const roleId = 1;
				mockRepository.findOne.mockResolvedValue(mockRole);

				const result = await service.findById(roleId, mockTenantId);

				expect(result).toEqual(mockRole);
				expect(mockRepository.findOne).toHaveBeenCalledWith({
					where: {
						id: roleId,
						tenant_id: mockTenantId,
						deleted_at: null,
					},
				});
			});

			it('should return null if role not found', async () => {
				mockRepository.findOne.mockResolvedValue(null);

				const result = await service.findById(999, mockTenantId);

				expect(result).toBeNull();
			});
		});

		describe('findBy', () => {
			it('should find roles by custom criteria', async () => {
				const criteria = { name: 'Administrator' };
				const roles = [mockRole];
				mockRepository.find.mockResolvedValue(roles);

				const result = await service.findBy(mockTenantId, criteria);

				expect(result).toEqual(roles);
				expect(mockRepository.find).toHaveBeenCalledWith({
					where: {
						...criteria,
						tenant_id: mockTenantId,
						deleted_at: null,
					},
				});
			});
		});

		describe('count', () => {
			it('should return count of roles for tenant', async () => {
				mockRepository.count.mockResolvedValue(5);

				const result = await service.count(mockTenantId);

				expect(result).toBe(5);
				expect(mockRepository.count).toHaveBeenCalledWith({
					where: {
						tenant_id: mockTenantId,
						deleted_at: null,
					},
				});
			});
		});

		describe('exists', () => {
			it('should return true if role exists', async () => {
				mockRepository.count.mockResolvedValue(1);

				const result = await service.exists(mockTenantId, {
					name: 'Administrator',
				});

				expect(result).toBe(true);
			});

			it('should return false if role does not exist', async () => {
				mockRepository.count.mockResolvedValue(0);

				const result = await service.exists(mockTenantId, { name: 'NonExistent' });

				expect(result).toBe(false);
			});
		});
	});

	describe('edge cases and error scenarios', () => {
		it('should handle repository errors gracefully', async () => {
			mockRepository.find.mockRejectedValue(
				new Error('Database connection failed'),
			);

			await expect(service.findAllRoles(mockTenantId)).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should handle invalid tenant IDs', async () => {
			const invalidTenantId = -1;
			mockRepository.find.mockResolvedValue([]);

			const result = await service.findAllRoles(invalidTenantId);

			expect(result).toEqual([]);
			expect(mockRepository.find).toHaveBeenCalledWith({
				where: {
					tenant_id: invalidTenantId,
					deleted_at: null,
				},
				order: { id: 'ASC' },
			});
		});

		it('should allow empty role names in createRole', async () => {
			mockRepository.findOne.mockResolvedValue(null);
			const emptyNameRole = { ...mockRole, name: '' };
			mockRepository.create.mockReturnValue(emptyNameRole);
			mockRepository.save.mockResolvedValue(emptyNameRole);

			const result = await service.createRole('', mockTenantId);

			expect(result.name).toBe('');
		});

		it('should handle very long role names', async () => {
			const longRoleName = 'A'.repeat(300);
			mockRepository.findOne.mockResolvedValue(null);
			mockRepository.create.mockReturnValue({ ...mockRole, name: longRoleName });
			mockRepository.save.mockResolvedValue({ ...mockRole, name: longRoleName });

			const result = await service.createRole(longRoleName, mockTenantId);

			expect(result.name).toBe(longRoleName);
		});
	});
});
