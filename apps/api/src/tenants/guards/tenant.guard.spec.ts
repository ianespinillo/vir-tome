import {
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/services/users.service';
import { TenantGuard } from './tenant.guard';

// Mocks
const mockTenantService = {
	findById: jest.fn(),
	findBySubdomain: jest.fn(),
};

const mockUsersService = {
	findById: jest.fn(),
};

const mockTenant = {
	id: 1,
	name: 'Test Tenant',
	subdomain: 'test',
};

const mockUser = {
	id: 1,
	email: 'user@test.com',
	getTenants: jest.fn().mockReturnValue([{ id: 1 }]),
	hasAccessToTenant: jest.fn(),
};

describe('TenantGuard', () => {
	let guard: TenantGuard;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TenantGuard,
				{ provide: TenantsService, useValue: mockTenantService },
				{ provide: UsersService, useValue: mockUsersService },
			],
		}).compile();

		guard = module.get<TenantGuard>(TenantGuard);

		jest.clearAllMocks();

		// Defaults
		mockTenantService.findById.mockResolvedValue(mockTenant);
		mockTenantService.findBySubdomain.mockResolvedValue(mockTenant);
		mockUsersService.findById.mockResolvedValue(mockUser);
	});

	const createMockContext = (requestData: any) =>
		({
			switchToHttp: () => ({
				getRequest: () => requestData,
			}),
		}) as ExecutionContext;

	describe('successful access', () => {
		it('should allow access with valid x-tenant-id header', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: null,
			};

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findById).toHaveBeenCalledWith(1);
		});

		it('should allow access with valid subdomain', async () => {
			const mockRequest = {
				headers: {},
				path: '/app/test',
				ip: '127.0.0.1',
				user: null,
			};

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findBySubdomain).toHaveBeenCalledWith('test');
		});

		it('should allow access when user belongs to tenant', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: { id: 1 },
				tenant: { id: 1 },
			};
			mockUser.hasAccessToTenant.mockReturnValueOnce(true);

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockUsersService.findById).toHaveBeenCalledWith(1);
		});
	});

	describe('public routes', () => {
		it('should allow access to public routes without tenant', async () => {
			const mockRequest = {
				headers: {},
				path: '/api/health',
				ip: '127.0.0.1',
				user: null,
			};

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findById).not.toHaveBeenCalled();
		});

		it('should allow access to auth login without tenant', async () => {
			const mockRequest = {
				headers: {},
				path: '/auth/login',
				ip: '127.0.0.1',
				user: null,
			};

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findById).not.toHaveBeenCalled();
		});
	});

	describe('access denied', () => {
		it('should deny access without tenant on protected routes', async () => {
			const mockRequest = {
				headers: {},
				path: '/api/some-path',
				ip: '127.0.0.1',
				user: null,
			};

			mockTenantService.findBySubdomain.mockResolvedValueOnce(null);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access with invalid tenant ID', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': 'invalid' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: null,
			};

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access when tenant not found', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '999' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: null,
			};

			mockTenantService.findById.mockResolvedValueOnce(null);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access when user does not belong to tenant', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: { id: 1 },
			};

			const userFromDifferentTenant = { ...mockUser, tenant_id: 2 };
			mockUsersService.findById.mockResolvedValueOnce(userFromDifferentTenant);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('edge cases', () => {
		it('should handle special subdomains correctly', async () => {
			const mockRequest = {
				headers: {},
				path: '/app/www',
				ip: '127.0.0.1',
				user: null,
			};

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);

			expect(mockTenantService.findBySubdomain).not.toHaveBeenCalled();
		});

		it('should handle user not found scenario', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				path: '/api/products',
				ip: '127.0.0.1',
				user: { id: 999 },
			};

			mockUsersService.findById.mockResolvedValueOnce(null);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(ForbiddenException);
		});
	});
});
