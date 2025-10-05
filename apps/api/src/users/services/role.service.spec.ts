import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
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
		name: ROLES.ADMIN,
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
		const roleName = ROLES.ADMIN;

		it('should create a role successfully', async () => {
			mockRepository.findOne.mockResolvedValue(null);
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
		const roleName = ROLES.ADMIN;

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

			const result = await service.findRoleByName(ROLES.STUDENT, mockTenantId);

			expect(result).toBeNull();
		});
	});

	describe('findAllRoles', () => {
		const mockRoles = [
			{ ...mockRole, id: 1, name: ROLES.ADMIN },
			{ ...mockRole, id: 2, name: ROLES.LIBRARIAN },
			{ ...mockRole, id: 3, name: ROLES.TEACHER },
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
			{ name: ROLES.ADMIN },
			{ name: ROLES.LIBRARIAN },
			{ name: ROLES.TEACHER },
			{ name: ROLES.STUDENT },
		];

		it('should initialize all default roles when none exist', async () => {
			const createdRoles = [
				{ ...mockRole, id: 1, name: ROLES.ADMIN },
				{ ...mockRole, id: 2, name: ROLES.LIBRARIAN },
				{ ...mockRole, id: 3, name: ROLES.TEACHER },
				{ ...mockRole, id: 4, name: ROLES.STUDENT },
			];

			mockRepository.findOne.mockResolvedValue(null);

			jest.spyOn(service, 'createRole').mockImplementation(async (name) => {
				const role = createdRoles.find((r) => r.name === name);
				return Promise.resolve(role as RoleEntity);
			});

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(service.createRole).toHaveBeenCalledTimes(4);

			const resultNames = result.map((r) => r.name);
			expect(resultNames).toContain(ROLES.ADMIN);
			expect(resultNames).toContain(ROLES.LIBRARIAN);
			expect(resultNames).toContain(ROLES.TEACHER);
			expect(resultNames).toContain(ROLES.STUDENT);
		});

		it('should handle existing roles and return them', async () => {
			const existingRole = { ...mockRole, name: ROLES.ADMIN };

			jest
				.spyOn(service, 'createRole')
				.mockRejectedValueOnce(new BadRequestException('Role already exists'))
				.mockImplementation(async (name) => {
					return Promise.resolve({
						...mockRole,
						name,
					} as RoleEntity);
				});

			mockRepository.findOne.mockResolvedValue(existingRole);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual(existingRole);
		});

		it('should handle mixed scenario of existing and new roles', async () => {
			const existingAdminRole = { ...mockRole, name: ROLES.ADMIN };

			jest
				.spyOn(service, 'createRole')
				.mockRejectedValueOnce(new Error('Role already exists'))
				.mockResolvedValueOnce({
					...mockRole,
					id: 2,
					name: ROLES.LIBRARIAN,
				} as RoleEntity)
				.mockResolvedValueOnce({
					...mockRole,
					id: 3,
					name: ROLES.TEACHER,
				} as RoleEntity)
				.mockResolvedValueOnce({
					...mockRole,
					id: 4,
					name: ROLES.STUDENT,
				} as RoleEntity);

			mockRepository.findOne.mockResolvedValue(existingAdminRole);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual(existingAdminRole);
		});

		it('should skip roles that fail to create and cannot be found', async () => {
			jest
				.spyOn(service, 'createRole')
				.mockRejectedValue(new Error('Creation failed'));

			mockRepository.findOne.mockResolvedValue(null);

			const result = await service.initializeDefaultRoles(mockTenantId);

			expect(result).toHaveLength(0);
		});
	});

	describe('getDefaultRoles', () => {
		const defaultRoleNames = [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
			ROLES.STUDENT,
		];

		const mockDefaultRoles = [
			{ ...mockRole, id: 1, name: ROLES.ADMIN },
			{ ...mockRole, id: 2, name: ROLES.LIBRARIAN },
			{ ...mockRole, id: 3, name: ROLES.TEACHER },
			{ ...mockRole, id: 4, name: ROLES.STUDENT },
		];

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
				const criteria = { name: ROLES.ADMIN };
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
					name: ROLES.ADMIN,
				});

				expect(result).toBe(true);
			});

			it('should return false if role does not exist', async () => {
				mockRepository.count.mockResolvedValue(0);

				const result = await service.exists(mockTenantId, {
					name: ROLES.STUDENT,
				});

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
	});
});
