import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SignUpDto } from '@repo/common';
import { IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { PasswordAdapter } from '../../core/passport-adapter';
import { EmailService } from '../../email/email.service';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from './role.service';
import { UsersService } from './users.service';

// Mock PasswordAdapter
jest.mock('../../core/passport-adapter');

describe('UsersService', () => {
	let service: UsersService;
	let userRepository: Repository<UserEntity>;
	let emailService: EmailService;
	let roleService: RoleService;

	const mockQueryBuilder = {
		innerJoin: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		andWhere: jest.fn().mockReturnThis(),
		getCount: jest.fn(),
	};

	const mockUserRepository = {
		findOne: jest.fn(),
		find: jest.fn(),
		findAndCount: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		count: jest.fn(),
		createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
		withDeleted: jest.fn().mockReturnThis(),
	};

	const mockEmailService = {
		sendEmailWelcome: jest.fn(),
	};

	const mockRoleService = {
		findById: jest.fn(),
	};

	const mockTenantId = 1;
	const mockRole: RoleEntity = {
		id: 1,
		name: 'Student',
		tenant_id: mockTenantId,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: undefined,
		tenant: {} as TenantEntity,
		users: [],
	};

	const mockUser: UserEntity = {
		id: 1,
		name: 'John',
		surname: 'Doe',
		email: 'john.doe@example.com',
		password: 'hashedPassword123',
		role: mockRole,
		tenant_id: mockTenantId,
		created_at: new Date(),
		updated_at: new Date(),
		deleted_at: undefined,
		tenant: {} as TenantEntity,
		tokens: [],
	};

	const mockSignUpDto: SignUpDto = {
		name: 'John',
		surname: 'Doe',
		email: 'john.doe@example.com',
		roleId: 1,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(UserEntity),
					useValue: mockUserRepository,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: RoleService,
					useValue: mockRoleService,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		userRepository = module.get<Repository<UserEntity>>(
			getRepositoryToken(UserEntity),
		);
		emailService = module.get<EmailService>(EmailService);
		roleService = module.get<RoleService>(RoleService);

		// Reset mocks
		jest.clearAllMocks();
		(PasswordAdapter.generateHashedPassword as jest.Mock).mockClear();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('createUser', () => {
		const mockPasswordGeneration = {
			password: 'tempPassword123',
			hashedPassword: 'hashedPassword123',
		};

		beforeEach(() => {
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue(
				mockPasswordGeneration,
			);
		});

		it('should create a user successfully', async () => {
			mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
			mockRoleService.findById.mockResolvedValue(mockRole);
			mockUserRepository.create.mockReturnValue(mockUser);
			mockUserRepository.save.mockResolvedValue(mockUser);
			mockEmailService.sendEmailWelcome.mockResolvedValue(undefined);

			const result = await service.createUser(mockSignUpDto, mockTenantId);

			expect(result).toEqual(mockUser);
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockSignUpDto.email, tenant_id: mockTenantId },
			});
			expect(mockRoleService.findById).toHaveBeenCalledWith(
				mockSignUpDto.roleId,
				mockTenantId,
			);
			expect(PasswordAdapter.generateHashedPassword).toHaveBeenCalledWith(8);
			expect(mockUserRepository.create).toHaveBeenCalledWith({
				name: mockSignUpDto.name,
				email: mockSignUpDto.email,
				surname: mockSignUpDto.surname,
				password: mockPasswordGeneration.hashedPassword,
				role: {
					id: mockSignUpDto.roleId,
				},
				tenant_id: mockTenantId,
			});
			expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
			expect(mockEmailService.sendEmailWelcome).toHaveBeenCalledWith({
				to: mockSignUpDto.email,
				password: mockPasswordGeneration.password,
			});
		});

		it('should throw BadRequestException if user already exists', async () => {
			mockUserRepository.findOne.mockResolvedValue(mockUser);

			await expect(
				service.createUser(mockSignUpDto, mockTenantId),
			).rejects.toThrow(new BadRequestException('User already exists'));

			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: mockSignUpDto.email, tenant_id: mockTenantId },
			});
			expect(mockRoleService.findById).not.toHaveBeenCalled();
			expect(mockUserRepository.save).not.toHaveBeenCalled();
			expect(mockEmailService.sendEmailWelcome).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException if role does not exist', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(null);

			await expect(
				service.createUser(mockSignUpDto, mockTenantId),
			).rejects.toThrow(new BadRequestException('Role does not exist'));

			expect(mockRoleService.findById).toHaveBeenCalledWith(
				mockSignUpDto.roleId,
				mockTenantId,
			);
			expect(mockUserRepository.save).not.toHaveBeenCalled();
			expect(mockEmailService.sendEmailWelcome).not.toHaveBeenCalled();
		});

		it('should handle password generation failure', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockRejectedValue(
				new Error('Password generation failed'),
			);

			await expect(
				service.createUser(mockSignUpDto, mockTenantId),
			).rejects.toThrow('Password generation failed');

			expect(mockUserRepository.save).not.toHaveBeenCalled();
			expect(mockEmailService.sendEmailWelcome).not.toHaveBeenCalled();
		});

		it('should handle database save failure', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);
			mockUserRepository.create.mockReturnValue(mockUser);
			mockUserRepository.save.mockRejectedValue(new Error('Database error'));

			await expect(
				service.createUser(mockSignUpDto, mockTenantId),
			).rejects.toThrow('Database error');

			expect(mockEmailService.sendEmailWelcome).not.toHaveBeenCalled();
		});

		it('should handle email service failure', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);
			mockUserRepository.create.mockReturnValue(mockUser);
			mockUserRepository.save.mockResolvedValue(mockUser);
			mockEmailService.sendEmailWelcome.mockRejectedValue(
				new Error('Email service unavailable'),
			);

			await expect(
				service.createUser(mockSignUpDto, mockTenantId),
			).rejects.toThrow('Email service unavailable');

			expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
		});

		it('should handle role with id 0 (falsy value)', async () => {
			const signUpDtoWithZeroRole = { ...mockSignUpDto, roleId: 0 };
			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(null);

			await expect(
				service.createUser(signUpDtoWithZeroRole, mockTenantId),
			).rejects.toThrow(new BadRequestException('Role does not exist'));
		});

		it('should create user with minimal valid data', async () => {
			const minimalSignUpDto: SignUpDto = {
				name: 'A',
				surname: 'B',
				email: 'a@b.com',
				roleId: 1,
			};

			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);
			const minimalUser = {
				...mockUser,
				name: 'A',
				surname: 'B',
				email: 'a@b.com',
			};
			mockUserRepository.create.mockReturnValue(minimalUser);
			mockUserRepository.save.mockResolvedValue(minimalUser);
			mockEmailService.sendEmailWelcome.mockResolvedValue(undefined);

			const result = await service.createUser(minimalSignUpDto, mockTenantId);

			expect(result).toEqual(minimalUser);
			expect(mockEmailService.sendEmailWelcome).toHaveBeenCalledWith({
				to: 'a@b.com',
				password: mockPasswordGeneration.password,
			});
		});
	});

	describe('findUserByEmail', () => {
		const email = 'john.doe@example.com';

		it('should find user by email successfully', async () => {
			mockUserRepository.findOne.mockResolvedValue(mockUser);

			const result = await service.findUserByEmail(email, mockTenantId);

			expect(result).toEqual(mockUser);
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email, tenant_id: mockTenantId },
			});
		});

		it('should return null if user not found', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail(
				'nonexistent@example.com',
				mockTenantId,
			);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: 'nonexistent@example.com', tenant_id: mockTenantId },
			});
		});

		it('should handle invalid email formats', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail('invalid-email', mockTenantId);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: 'invalid-email', tenant_id: mockTenantId },
			});
		});

		it('should handle empty email', async () => {
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail('', mockTenantId);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: '', tenant_id: mockTenantId },
			});
		});

		it('should handle case-sensitive email search', async () => {
			const upperCaseEmail = 'JOHN.DOE@EXAMPLE.COM';
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail(upperCaseEmail, mockTenantId);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: upperCaseEmail, tenant_id: mockTenantId },
			});
		});
	});

	describe('findActiveUsers', () => {
		const mockUsers = [
			{ ...mockUser, id: 1, name: 'John' },
			{ ...mockUser, id: 2, name: 'Jane' },
			{ ...mockUser, id: 3, name: 'Bob' },
		];

		it('should return all active users for tenant', async () => {
			mockUserRepository.find.mockResolvedValue(mockUsers);

			const result = await service.findActiveUsers(mockTenantId);

			expect(result).toEqual(mockUsers);
			expect(mockUserRepository.find).toHaveBeenCalledWith({
				where: { tenant_id: mockTenantId },
			});
		});

		it('should return empty array if no active users found', async () => {
			mockUserRepository.find.mockResolvedValue([]);

			const result = await service.findActiveUsers(mockTenantId);

			expect(result).toEqual([]);
			expect(mockUserRepository.find).toHaveBeenCalledWith({
				where: { tenant_id: mockTenantId },
			});
		});

		it('should handle database errors gracefully', async () => {
			mockUserRepository.find.mockRejectedValue(
				new Error('Database connection failed'),
			);

			await expect(service.findActiveUsers(mockTenantId)).rejects.toThrow(
				'Database connection failed',
			);
		});

		it('should handle invalid tenant ID', async () => {
			const invalidTenantId = -1;
			mockUserRepository.find.mockResolvedValue([]);

			const result = await service.findActiveUsers(invalidTenantId);

			expect(result).toEqual([]);
			expect(mockUserRepository.find).toHaveBeenCalledWith({
				where: { tenant_id: invalidTenantId },
			});
		});

		it('should handle very large tenant ID', async () => {
			const largeTenantId = Number.MAX_SAFE_INTEGER;
			mockUserRepository.find.mockResolvedValue([]);

			const result = await service.findActiveUsers(largeTenantId);

			expect(result).toEqual([]);
			expect(mockUserRepository.find).toHaveBeenCalledWith({
				where: { tenant_id: largeTenantId },
			});
		});
	});

	describe('getUserStats', () => {
		beforeEach(() => {
			// Reset query builder mocks
			mockQueryBuilder.innerJoin.mockReturnThis();
			mockQueryBuilder.where.mockReturnThis();
			mockQueryBuilder.andWhere.mockReturnThis();
		});

		it('should return user statistics successfully', async () => {
			const mockStats = {
				total: 100,
				active: 85,
				deleted: 15,
			};
			const withTokensCount = 25;

			// Mock the getStats method from MultiTenantService
			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockResolvedValue(withTokensCount);

			const result = await service.getUserStats(mockTenantId);

			expect(result).toEqual({
				total: mockStats.total,
				active: mockStats.active,
				withTokens: withTokensCount,
			});

			expect(service.getStats).toHaveBeenCalledWith(mockTenantId);
			expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
				'user.tokens',
				'token',
			);
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'user.tenant_id = :tenantId',
				{ tenantId: mockTenantId },
			);
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'user.deleted_at IS NULL',
			);
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'token.expires_at > :now',
				{ now: expect.any(Date) },
			);
			expect(mockQueryBuilder.getCount).toHaveBeenCalled();
		});

		it('should handle zero user statistics', async () => {
			const mockStats = {
				total: 0,
				active: 0,
				deleted: 0,
			};
			const withTokensCount = 0;

			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockResolvedValue(withTokensCount);

			const result = await service.getUserStats(mockTenantId);

			expect(result).toEqual({
				total: 0,
				active: 0,
				withTokens: 0,
			});
		});

		it('should handle users with tokens count larger than active users', async () => {
			const mockStats = {
				total: 10,
				active: 8,
				deleted: 2,
			};
			const withTokensCount = 12; // This shouldn't happen in reality, but we test the edge case

			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockResolvedValue(withTokensCount);

			const result = await service.getUserStats(mockTenantId);

			expect(result).toEqual({
				total: mockStats.total,
				active: mockStats.active,
				withTokens: withTokensCount,
			});
		});

		it('should handle getStats failure', async () => {
			jest
				.spyOn(service, 'getStats')
				.mockRejectedValue(new Error('Stats query failed'));

			await expect(service.getUserStats(mockTenantId)).rejects.toThrow(
				'Stats query failed',
			);
		});

		it('should handle tokens count query failure', async () => {
			const mockStats = {
				total: 100,
				active: 85,
				deleted: 15,
			};

			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockRejectedValue(
				new Error('Token count query failed'),
			);

			await expect(service.getUserStats(mockTenantId)).rejects.toThrow(
				'Token count query failed',
			);
		});

		it('should use current date for token expiration check', async () => {
			const mockStats = {
				total: 50,
				active: 45,
				deleted: 5,
			};
			const withTokensCount = 20;
			const beforeCall = new Date();

			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockResolvedValue(withTokensCount);

			await service.getUserStats(mockTenantId);

			const afterCall = new Date();

			// Verify that andWhere was called with a date between beforeCall and afterCall
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'token.expires_at > :now',
				{
					now: expect.any(Date),
				},
			);

			// Get the actual date that was passed
			const calls = mockQueryBuilder.andWhere.mock.calls;
			const dateCall = calls.find((call) => call[0] === 'token.expires_at > :now');

			if (dateCall[1]?.now) {
				const passedDate = dateCall[1].now;
				expect(passedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
				expect(passedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
			}
		});

		it('should handle invalid tenant ID in stats query', async () => {
			const invalidTenantId = Number.NaN;
			const mockStats = {
				total: 0,
				active: 0,
				deleted: 0,
			};

			jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);
			mockQueryBuilder.getCount.mockResolvedValue(0);

			const result = await service.getUserStats(invalidTenantId);

			expect(result).toEqual({
				total: 0,
				active: 0,
				withTokens: 0,
			});
		});
	});

	describe('inherited methods from MultiTenantService', () => {
		describe('findById', () => {
			it('should find user by id and tenant', async () => {
				const userId = 1;
				mockUserRepository.findOne.mockResolvedValue(mockUser);

				const result = await service.findById(userId, mockTenantId);

				expect(result).toEqual(mockUser);
				expect(mockUserRepository.findOne).toHaveBeenCalledWith({
					where: {
						id: userId,
						tenant_id: mockTenantId,
						deleted_at: null,
					},
				});
			});
		});

		describe('findAll', () => {
			it('should find all users for tenant', async () => {
				const users = [mockUser];
				mockUserRepository.find.mockResolvedValue(users);

				const result = await service.findAll(mockTenantId);

				expect(result).toEqual(users);
				expect(mockUserRepository.find).toHaveBeenCalledWith({
					where: {
						tenant_id: mockTenantId,
						deleted_at: null,
					},
					order: { id: 'ASC' },
				});
			});
		});

		describe('count', () => {
			it('should return count of users for tenant', async () => {
				mockUserRepository.count.mockResolvedValue(42);

				const result = await service.count(mockTenantId);

				expect(result).toBe(42);
				expect(mockUserRepository.count).toHaveBeenCalledWith({
					where: {
						tenant_id: mockTenantId,
						deleted_at: null,
					},
				});
			});
		});

		describe('exists', () => {
			it('should return true if user exists', async () => {
				mockUserRepository.count.mockResolvedValue(1);

				const result = await service.exists(mockTenantId, {
					email: 'test@example.com',
				});

				expect(result).toBe(true);
			});

			it('should return false if user does not exist', async () => {
				mockUserRepository.count.mockResolvedValue(0);

				const result = await service.exists(mockTenantId, {
					email: 'nonexistent@example.com',
				});

				expect(result).toBe(false);
			});
		});
	});

	describe('edge cases and error scenarios', () => {
		it('should handle extremely long email addresses', async () => {
			const longEmail = `${'a'.repeat(250)}@example.com`;
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail(longEmail, mockTenantId);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: longEmail, tenant_id: mockTenantId },
			});
		});

		it('should handle special characters in email', async () => {
			const specialEmail = 'test+special@example-domain.co.uk';
			mockUserRepository.findOne.mockResolvedValue(null);

			const result = await service.findUserByEmail(specialEmail, mockTenantId);

			expect(result).toBeNull();
			expect(mockUserRepository.findOne).toHaveBeenCalledWith({
				where: { email: specialEmail, tenant_id: mockTenantId },
			});
		});

		it('should handle unicode characters in names', async () => {
			const unicodeSignUpDto: SignUpDto = {
				name: 'José',
				surname: 'García',
				email: 'jose.garcia@example.com',
				roleId: 1,
			};

			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);

			const unicodeUser = {
				...mockUser,
				name: 'José',
				surname: 'García',
				email: 'jose.garcia@example.com',
			};

			mockUserRepository.create.mockReturnValue(unicodeUser);
			mockUserRepository.save.mockResolvedValue(unicodeUser);
			mockEmailService.sendEmailWelcome.mockResolvedValue(undefined);
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue({
				password: 'tempPassword123',
				hashedPassword: 'hashedPassword123',
			});

			const result = await service.createUser(unicodeSignUpDto, mockTenantId);

			expect(result.name).toBe('José');
			expect(result.surname).toBe('García');
		});

		it('should handle null/undefined values gracefully in createUser', async () => {
			const invalidSignUpDto = {
				name: null,
				surname: undefined,
				email: 'test@example.com',
				roleId: 1,
			} as any;

			mockUserRepository.findOne.mockResolvedValue(null);
			mockRoleService.findById.mockResolvedValue(mockRole);

			// The repository create should handle null/undefined values
			const userWithNulls = {
				...mockUser,
				name: null,
				surname: undefined,
			};

			mockUserRepository.create.mockReturnValue(userWithNulls);
			mockUserRepository.save.mockResolvedValue(userWithNulls);
			mockEmailService.sendEmailWelcome.mockResolvedValue(undefined);
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue({
				password: 'tempPassword123',
				hashedPassword: 'hashedPassword123',
			});

			const result = await service.createUser(invalidSignUpDto, mockTenantId);

			expect(result.name).toBeNull();
			expect(result.surname).toBeUndefined();
		});

		it('should handle concurrent user creation attempts', async () => {
			// Simulate race condition where user is created between check and save
			mockUserRepository.findOne
				.mockResolvedValueOnce(null) // First check: user doesn't exist
				.mockResolvedValueOnce(null); // Second check: user still doesn't exist

			mockRoleService.findById.mockResolvedValue(mockRole);

			// Create two different user objects for each call
			const user1 = { ...mockUser, id: 1 };
			const user2 = { ...mockUser, id: 2 };

			mockUserRepository.create
				.mockReturnValueOnce(user1)
				.mockReturnValueOnce(user2);
			mockUserRepository.save
				.mockResolvedValueOnce(user1)
				.mockResolvedValueOnce(user2);
			mockEmailService.sendEmailWelcome.mockResolvedValue(undefined);
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue({
				password: 'tempPassword123',
				hashedPassword: 'hashedPassword123',
			});

			const result1 = service.createUser(mockSignUpDto, mockTenantId);
			const result2 = service.createUser(mockSignUpDto, mockTenantId);

			const [createdUser1, createdUser2] = await Promise.all([result1, result2]);

			expect(createdUser1).toEqual(user1);
			expect(createdUser2).toEqual(user2);
			expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
		});

		it('should handle repository returning unexpected data types', async () => {
			mockUserRepository.findOne.mockResolvedValue('unexpected string' as any);

			const result = await service.findUserByEmail(
				'test@example.com',
				mockTenantId,
			);

			expect(result).toBe('unexpected string');
		});
	});
});
