import { SuperAdminService } from '@/super-admin/services/super-admin.service';
import { TenantsService } from '@/tenants/tenants.service';
import { UsersService } from '@/users/services/users.service';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PAYLOAD_TYPE } from '@repo/common';
import { JwtStrategy } from '../strategies/jwt.strategy'; // Ajusta la ruta según tu estructura

describe('JwtStrategy', () => {
	let strategy: JwtStrategy;
	let usersService: UsersService;
	let tenantsService: TenantsService;
	let superAdminService: SuperAdminService;

	// Mocks de los servicios
	const mockConfigService = {
		get: jest.fn().mockReturnValue('test-secret'),
	};

	const mockUsersService = {
		findById: jest.fn(),
	};

	const mockTenantsService = {
		findById: jest.fn(),
	};

	const mockSuperAdminService = {
		findById: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtStrategy,
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: TenantsService, useValue: mockTenantsService },
				{ provide: SuperAdminService, useValue: mockSuperAdminService },
			],
		}).compile();

		strategy = module.get<JwtStrategy>(JwtStrategy);
		usersService = module.get<UsersService>(UsersService);
		tenantsService = module.get<TenantsService>(TenantsService);
		superAdminService = module.get<SuperAdminService>(SuperAdminService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
	});

	describe('validate', () => {
		// --- CASO 1: SUPER_ADMIN_LOGIN ---
		describe('when payload type is SUPER_ADMIN_LOGIN', () => {
			const payload = {
				type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN,
				sub: 'super-admin-id',
				email: 'super@admin.com',
			} as any;

			it('should validate and return super admin user', async () => {
				const mockSuperAdmin = { id: 'super-admin-id', email: 'super@admin.com' };
				jest
					.spyOn(mockSuperAdminService, 'findById')
					.mockResolvedValue(mockSuperAdmin);

				const result = await strategy.validate(payload);

				expect(mockSuperAdminService.findById).toHaveBeenCalledWith(payload.sub);
				expect(result).toEqual({
					userId: mockSuperAdmin.id,
					email: mockSuperAdmin.email,
					type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN,
				});
			});

			it('should throw UnauthorizedException if super admin is not found', async () => {
				jest.spyOn(mockSuperAdminService, 'findById').mockResolvedValue(null);

				await expect(strategy.validate(payload)).rejects.toThrow(
					UnauthorizedException,
				);
				await expect(strategy.validate(payload)).rejects.toThrow(
					'Super admin not found',
				);
			});
		});

		// --- CASO 2: USER_LOGIN ---
		describe('when payload type is USER_LOGIN', () => {
			const payload = {
				type: PAYLOAD_TYPE.USER_LOGIN,
				sub: 'user-id',
				email: 'user@test.com',
				tenantId: 'tenant-id',
			} as any;

			const mockTenant = { id: 'tenant-id', name: 'Test Tenant' };

			it('should throw UnauthorizedException if tenant is not found', async () => {
				jest.spyOn(mockTenantsService, 'findById').mockResolvedValue(null);

				await expect(strategy.validate(payload)).rejects.toThrow(
					UnauthorizedException,
				);
				await expect(strategy.validate(payload)).rejects.toThrow(
					'Tenant not found',
				);
			});

			it('should throw UnauthorizedException if user is not found', async () => {
				jest.spyOn(mockTenantsService, 'findById').mockResolvedValue(mockTenant);
				jest.spyOn(mockUsersService, 'findById').mockResolvedValue(null);

				await expect(strategy.validate(payload)).rejects.toThrow(
					UnauthorizedException,
				);
				await expect(strategy.validate(payload)).rejects.toThrow('User not found');
			});

			it('should throw UnauthorizedException if user has no access to tenant', async () => {
				jest.spyOn(mockTenantsService, 'findById').mockResolvedValue(mockTenant);

				const mockUserNoAccess = {
					id: 'user-id',
					email: 'user@test.com',
					hasAccessToTenant: jest.fn().mockReturnValue(false),
				};
				jest
					.spyOn(mockUsersService, 'findById')
					.mockResolvedValue(mockUserNoAccess);

				await expect(strategy.validate(payload)).rejects.toThrow(
					UnauthorizedException,
				);
				await expect(strategy.validate(payload)).rejects.toThrow(
					'User has no access to tenant',
				);
			});

			it('should return valid user data with role information if validation passes', async () => {
				jest.spyOn(mockTenantsService, 'findById').mockResolvedValue(mockTenant);

				const mockRole = { id: 'role-id', name: 'ADMIN' };
				const mockUser = {
					id: 'user-id',
					email: 'user@test.com',
					hasAccessToTenant: jest.fn().mockReturnValue(true),
					getRoleInTenant: jest.fn().mockReturnValue(mockRole),
				};
				jest.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser);

				const result = await strategy.validate(payload);

				expect(mockUser.hasAccessToTenant).toHaveBeenCalledWith(mockTenant.id);
				expect(mockUser.getRoleInTenant).toHaveBeenCalledWith(mockTenant.id);
				expect(result).toEqual({
					userId: mockUser.id,
					email: mockUser.email,
					tenantId: mockTenant.id,
					roleId: mockRole.id,
					roleName: mockRole.name,
					tenant: mockTenant,
					type: PAYLOAD_TYPE.USER_LOGIN,
				});
			});

			it('should handle user without specific role gracefully (null role)', async () => {
				jest.spyOn(mockTenantsService, 'findById').mockResolvedValue(mockTenant);

				const mockUser = {
					id: 'user-id',
					email: 'user@test.com',
					hasAccessToTenant: jest.fn().mockReturnValue(true),
					getRoleInTenant: jest.fn().mockReturnValue(null), // Sin rol
				};
				jest.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser);

				const result = await strategy.validate(payload);

				expect(result).toEqual({
					userId: mockUser.id,
					email: mockUser.email,
					tenantId: mockTenant.id,
					roleId: null,
					roleName: null,
					tenant: mockTenant,
					type: PAYLOAD_TYPE.USER_LOGIN,
				});
			});
		});

		// --- CASO 3: TIPO INVÁLIDO ---
		it('should throw UnauthorizedException for invalid payload type', async () => {
			const payload = {
				type: 'INVALID_TYPE',
				sub: 'some-id',
			} as any;

			await expect(strategy.validate(payload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(strategy.validate(payload)).rejects.toThrow(
				'Invalid token payload type',
			);
		});
	});
});
