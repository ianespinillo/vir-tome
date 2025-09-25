import {
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';
// test/guards/tenant.guard.spec.ts
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
	tenantId: 1,
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
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: null,
				path: '/api/products', // 👈 AÑADIR path
				method: 'GET', // 👈 AÑADIR method
			};

			mockTenantService.findById.mockResolvedValue(mockTenant);

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findById).toHaveBeenCalledWith(1);
		});

		it('should allow access with valid subdomain', async () => {
			const mockRequest = {
				headers: {},
				hostname: 'test.example.com',
				ip: '127.0.0.1',
				user: null,
				path: '/api/products', // 👈 AÑADIR path
				method: 'GET', // 👈 AÑADIR method
			};

			mockTenantService.findBySubdomain.mockResolvedValue(mockTenant);
			mockTenantService.findById.mockResolvedValue(mockTenant);

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findBySubdomain).toHaveBeenCalledWith('test');
		});

		it('should allow access when user belongs to tenant', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: { id: 1 },
				path: '/api/products', // 👈 AÑADIR path
				method: 'GET', // 👈 AÑADIR method
			};

			mockTenantService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(mockUser);

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockUsersService.findById).toHaveBeenCalledWith(1);
		});
	});

	describe('public routes', () => {
		it('should allow access to public routes without tenant', async () => {
			const mockRequest = {
				headers: {},
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: null,
				path: '/api/health', // 👈 Ruta pública
				method: 'GET',
			};

			const result = await guard.canActivate(createMockContext(mockRequest));

			expect(result).toBe(true);
			expect(mockTenantService.findById).not.toHaveBeenCalled();
		});

		it('should allow access to auth login without tenant', async () => {
			const mockRequest = {
				headers: {},
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: null,
				path: '/auth/login', // 👈 Ruta pública
				method: 'POST',
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
				hostname: 'api.localhost', // subdomain especial
				ip: '127.0.0.1',
				user: null,
				path: '/api/products', // 👈 Ruta protegida
				method: 'GET',
			};

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access with invalid tenant ID', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': 'invalid' },
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: null,
				path: '/api/products',
				method: 'GET',
			};

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access when tenant not found', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '999' },
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: null,
				path: '/api/products',
				method: 'GET',
			};

			mockTenantService.findById.mockResolvedValue(null);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should deny access when user does not belong to tenant', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: { id: 1 },
				path: '/api/products',
				method: 'GET',
			};

			const userFromDifferentTenant = { ...mockUser, tenantId: 2 };
			mockTenantService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(userFromDifferentTenant);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('edge cases', () => {
		it('should handle special subdomains correctly', async () => {
			const mockRequest = {
				headers: {},
				hostname: 'www.example.com', // subdomain especial
				ip: '127.0.0.1',
				user: null,
				path: '/api/products',
				method: 'GET',
			};

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(UnauthorizedException);

			expect(mockTenantService.findBySubdomain).not.toHaveBeenCalled();
		});

		it('should handle user not found scenario', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				hostname: 'api.localhost',
				ip: '127.0.0.1',
				user: { id: 999 }, // usuario no existe
				path: '/api/products',
				method: 'GET',
			};

			mockTenantService.findById.mockResolvedValue(mockTenant);
			mockUsersService.findById.mockResolvedValue(null);

			await expect(
				guard.canActivate(createMockContext(mockRequest)),
			).rejects.toThrow(ForbiddenException);
		});
	});
});
