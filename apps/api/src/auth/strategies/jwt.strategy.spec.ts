import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// src/auth/strategies/__tests__/jwt.strategy.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthPayload } from '@repo/common';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/services/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
	let strategy: JwtStrategy;
	let usersService: UsersService;
	let tenantsService: TenantsService;

	const mockTenant = {
		id: 1,
		subdomain: 'escuela1',
		name: 'Escuela 1',
		is_active: true,
	};

	const mockUser = {
		id: 1,
		email: 'test@escuela1.com',
		name: 'Test',
		surname: 'User',
		password: 'hashedPassword123',
		tenant_id: 1,
		role: {
			id: 2,
			name: 'teacher',
		},
	};

	const mockUsersService = {
		findById: jest.fn(),
	};

	const mockTenantsService = {
		findById: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn((key: string, defaultValue?: string) => {
			if (key === 'JWT_SECRET') return 'test-secret-key';
			return defaultValue;
		}),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtStrategy,
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: TenantsService,
					useValue: mockTenantsService,
				},
				{
					provide: ConfigService,
					useValue: mockConfigService,
				},
			],
		}).compile();

		strategy = module.get<JwtStrategy>(JwtStrategy);
		usersService = module.get<UsersService>(UsersService);
		tenantsService = module.get<TenantsService>(TenantsService);

		jest.clearAllMocks();
	});

	describe('validate', () => {
		const validPayload: IAuthPayload = {
			sub: 1,
			email: 'test@escuela1.com',
			tenantId: 1,
			roleId: 2,
		};

		it('should successfully validate token with correct tenant and user', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await strategy.validate(validPayload);

			// Assert
			expect(tenantsService.findById).toHaveBeenCalledWith(1);
			expect(usersService.findById).toHaveBeenCalledWith(1, 1); // (tenantId, userId)
			expect(result).toEqual({
				userId: mockUser.id,
				email: mockUser.email,
				tenantId: mockTenant.id,
				roleId: mockUser.role.id,
				roleName: mockUser.role.name,
				tenant: mockTenant,
			});
		});

		it('should not include password in returned user', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await strategy.validate(validPayload);

			// Assert
			expect(result).not.toHaveProperty('password');
		});

		it('should throw UnauthorizedException if payload missing sub', async () => {
			// Arrange
			const invalidPayload = {
				email: 'test@escuela1.com',
				tenantId: 1,
				roleId: 2,
			} as any;

			// Act & Assert
			await expect(strategy.validate(invalidPayload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(invalidPayload)).rejects.toThrow(
				'Invalid token payload',
			);
		});

		it('should throw UnauthorizedException if payload missing tenantId', async () => {
			// Arrange
			const invalidPayload = {
				sub: 1,
				email: 'test@escuela1.com',
				roleId: 2,
			} as any;

			// Act & Assert
			await expect(strategy.validate(invalidPayload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(invalidPayload)).rejects.toThrow(
				'Invalid token payload',
			);
		});

		it('should throw UnauthorizedException if tenant not found', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				'Tenant not found',
			);
			expect(tenantsService.findById).toHaveBeenCalledWith(1);
		});

		it('should throw UnauthorizedException if tenant is inactive', async () => {
			// Arrange
			const inactiveTenant = { ...mockTenant, is_active: false };
			mockTenantsService.findById.mockResolvedValue(inactiveTenant);

			// Act & Assert
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				'Tenant is inactive',
			);
		});

		it('should throw UnauthorizedException if user not found', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(validPayload)).rejects.toThrow(
				'User not found in tenant',
			);
		});

		it('should validate user belongs to correct tenant', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			await strategy.validate(validPayload);

			// Assert
			expect(usersService.findById).toHaveBeenCalledWith(
				validPayload.tenantId,
				validPayload.sub,
			);
		});

		it('should fail if user belongs to different tenant', async () => {
			// Arrange
			const tenant2 = { ...mockTenant, id: 2, subdomain: 'escuela2' };
			mockTenantsService.findById.mockResolvedValue(tenant2);
			mockUsersService.findById.mockResolvedValue(null); // User no existe en tenant 2

			const payloadTenant2 = { ...validPayload, tenantId: 2 };

			// Act & Assert
			await expect(strategy.validate(payloadTenant2)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(usersService.findById).toHaveBeenCalledWith(2, 1);
		});

		it('should include complete tenant object in result', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await strategy.validate(validPayload);

			// Assert
			expect(result.tenant).toEqual(mockTenant);
			expect(result.tenant.id).toBe(mockTenant.id);
			expect(result.tenant.name).toBe(mockTenant.name);
			expect(result.tenant.subdomain).toBe(mockTenant.subdomain);
		});

		it('should include role information in result', async () => {
			// Arrange
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await strategy.validate(validPayload);

			// Assert
			expect(result.roleId).toBe(mockUser.role.id);
			expect(result.roleName).toBe(mockUser.role.name);
		});

		it('should work with different tenants and users', async () => {
			// Arrange - Tenant 1, User 1
			mockTenantsService.findById.mockResolvedValueOnce(mockTenant);
			mockUsersService.findById.mockResolvedValueOnce(mockUser);

			// Act - Validate for tenant 1
			const result1 = await strategy.validate(validPayload);

			// Arrange - Tenant 2, User 2
			const tenant2 = { ...mockTenant, id: 2, subdomain: 'escuela2' };
			const user2 = { ...mockUser, id: 2, tenant_id: 2 };
			const payload2 = { ...validPayload, sub: 2, tenant_id: 2 };

			mockTenantsService.findById.mockResolvedValueOnce(tenant2);
			mockUsersService.findById.mockResolvedValueOnce(user2);

			// Act - Validate for tenant 2
			const result2 = await strategy.validate(payload2);

			// Assert
			expect(result1.tenantId).toBe(1);
			expect(result1.userId).toBe(1);
			expect(result2.tenantId).toBe(2);
			expect(result2.userId).toBe(2);
		});
	});

	describe('findTenant (private method behavior)', () => {
		it('should be called once per validation', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 1,
				email: 'test@escuela1.com',
				tenantId: 1,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			await strategy.validate(payload);

			// Assert
			expect(tenantsService.findById).toHaveBeenCalledTimes(1);
		});
	});

	describe('findUser (private method behavior)', () => {
		it('should be called once per validation', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 1,
				email: 'test@escuela1.com',
				tenantId: 1,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			await strategy.validate(payload);

			// Assert
			expect(usersService.findById).toHaveBeenCalledTimes(1);
		});

		it('should search user in correct tenant', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 5,
				email: 'test@escuela2.com',
				tenantId: 3,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue({
				...mockTenant,
				id: 3,
			});
			mockUsersService.findById.mockResolvedValue({
				...mockUser,
				id: 5,
				tenant_id: 3,
			});

			// Act
			await strategy.validate(payload);

			// Assert
			expect(usersService.findById).toHaveBeenCalledWith(3, 5); // (tenantId, userId)
		});
	});

	describe('error messages', () => {
		it('should have clear error for missing payload fields', async () => {
			// Arrange
			const invalidPayload = { email: 'test@test.com' } as any;

			// Act & Assert
			await expect(strategy.validate(invalidPayload)).rejects.toThrow(
				'Invalid token payload',
			);
		});

		it('should have clear error for tenant not found', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 1,
				email: 'test@escuela1.com',
				tenantId: 999,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(strategy.validate(payload)).rejects.toThrow('Tenant not found');
		});

		it('should have clear error for inactive tenant', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 1,
				email: 'test@escuela1.com',
				tenantId: 1,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue({
				...mockTenant,
				is_active: false,
			});

			// Act & Assert
			await expect(strategy.validate(payload)).rejects.toThrow(
				'Tenant is inactive',
			);
		});

		it('should have clear error for user not found', async () => {
			// Arrange
			const payload: IAuthPayload = {
				sub: 999,
				email: 'notfound@escuela1.com',
				tenantId: 1,
				roleId: 2,
			};
			mockTenantsService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(strategy.validate(payload)).rejects.toThrow(
				'User not found in tenant',
			);
		});
	});
});
