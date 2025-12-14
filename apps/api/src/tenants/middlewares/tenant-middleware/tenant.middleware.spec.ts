import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// src/common/middleware/__tests__/tenant.middleware.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PAYLOAD_TYPE } from '@repo/common';
import { Request, Response } from 'express';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
	let middleware: TenantMiddleware;
	let tenantsService: TenantsService;
	let jwtService: any;

	const mockTenant = {
		id: 1,
		subdomain: 'escuela1',
		name: 'Escuela 1',
		is_active: true,
	};

	const mockTenantsService = {
		findById: jest.fn(),
		findBySubdomain: jest.fn(),
	};

	const mockJwtService = {
		verify: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TenantMiddleware,
				{
					provide: TenantsService,
					useValue: mockTenantsService,
				},
				{ provide: 'JwtService', useValue: mockJwtService },
				{ provide: JwtService, useValue: mockJwtService },
			],
		}).compile();

		middleware = module.get<TenantMiddleware>(TenantMiddleware);
		tenantsService = module.get<TenantsService>(TenantsService);

		jest.clearAllMocks();
		jwtService = module.get<jest.Mocked<any>>(JwtService);
	});

	const createMockRequest = (overrides?: Partial<Request>): Partial<Request> => {
		return {
			headers: {},
			get: jest.fn(),
			...overrides,
		} as Partial<Request>;
	};

	const createMockResponse = (): Partial<Response> => {
		return {} as Partial<Response>;
	};

	const mockNext = jest.fn();

	describe('Header detection (X-Tenant-ID)', () => {
		it('should extract tenant from X-Tenant-ID header', async () => {
			// Arrange
			const req = createMockRequest({
				headers: { 'x-tenant-id': '1' },
			});
			const res = createMockResponse();
			mockTenantsService.findById.mockResolvedValue(mockTenant);

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findById).toHaveBeenCalledWith(1);
			expect(req.tenant).toEqual(mockTenant);
			expect(req.tenantId).toBe(1);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should throw NotFoundException if tenant ID not found', async () => {
			// Arrange
			const req = createMockRequest({
				headers: { 'x-tenant-id': '999' },
			});
			const res = createMockResponse();
			mockTenantsService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow(NotFoundException);
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow('Tenant with ID 999 not found');
		});

		it('should handle invalid tenant ID in header', async () => {
			// Arrange
			const req = createMockRequest({
				headers: { 'x-tenant-id': 'invalid' },
				get: jest.fn().mockReturnValue('localhost'),
			});
			const res = createMockResponse();

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findById).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled(); // Pasa por special case
		});
	});

	describe('Subdomain detection', () => {
		it('should extract tenant from subdomain', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('escuela1.tuapp.com'),
			});
			const res = createMockResponse();
			mockTenantsService.findBySubdomain.mockResolvedValue(mockTenant);

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('escuela1');
			expect(req.tenant).toEqual(mockTenant);
			expect(req.tenantId).toBe(1);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should handle subdomain with port', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('escuela1.localhost:3000'),
			});
			const res = createMockResponse();
			mockTenantsService.findBySubdomain.mockResolvedValue(mockTenant);

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findBySubdomain).toHaveBeenCalledWith('escuela1');
			expect(req.tenantId).toBe(1);
		});

		it('should throw NotFoundException if subdomain not found', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('unknown.tuapp.com'),
			});
			const res = createMockResponse();
			mockTenantsService.findBySubdomain.mockResolvedValue(null);

			// Act & Assert
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow(NotFoundException);
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow('Tenant with subdomain "unknown" not found');
		});
	});

	describe('Special cases', () => {
		it('should allow localhost without tenant', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('localhost:3000'),
			});
			const res = createMockResponse();

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findBySubdomain).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalled();
		});

		it('should allow www subdomain', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('www.tuapp.com'),
			});
			const res = createMockResponse();

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(mockNext).toHaveBeenCalled();
		});

		it('should allow admin subdomain', async () => {
			// Arrange
			const req = createMockRequest({
				get: jest.fn().mockReturnValue('admin.tuapp.com'),
			});
			const res = createMockResponse();

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe('Tenant validation', () => {
		it('should reject inactive tenant', async () => {
			// Arrange
			const inactiveTenant = { ...mockTenant, is_active: false };
			const req = createMockRequest({
				headers: { 'x-tenant-id': '1' },
			});
			const res = createMockResponse();
			mockTenantsService.findById.mockResolvedValue(inactiveTenant);

			// Act & Assert
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow(BadRequestException);
			await expect(
				middleware.use(req as Request, res as Response, mockNext),
			).rejects.toThrow('Tenant "Escuela 1" is inactive');
		});

		it('should accept active tenant', async () => {
			// Arrange
			const req = createMockRequest({
				headers: { 'x-tenant-id': '1' },
			});
			const res = createMockResponse();
			mockTenantsService.findById.mockResolvedValue(mockTenant);

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(req.tenant).toEqual(mockTenant);
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe('Priority', () => {
		it('should prioritize header over subdomain', async () => {
			// Arrange
			const req = createMockRequest({
				headers: { 'x-tenant-id': '2' },
				get: jest.fn().mockReturnValue('escuela1.tuapp.com'),
			});
			const res = createMockResponse();
			const tenant2 = { ...mockTenant, id: 2, subdomain: 'escuela2' };
			mockTenantsService.findById.mockResolvedValue(tenant2);

			// Act
			await middleware.use(req as Request, res as Response, mockNext);

			// Assert
			expect(tenantsService.findById).toHaveBeenCalledWith(2);
			expect(tenantsService.findBySubdomain).not.toHaveBeenCalled();
			expect(req.tenantId).toBe(2);
		});
	});
});
