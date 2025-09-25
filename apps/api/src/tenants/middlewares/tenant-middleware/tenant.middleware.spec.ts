import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantEntity } from '../../../tenants/entities/tenant.entity';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
	let middleware: TenantMiddleware;
	let tenantService: jest.Mocked<TenantsService>;
	let mockRequest: any;
	let mockResponse: any;
	let mockNext: jest.Mock;

	beforeEach(async () => {
		const mockTenantService = {
			findById: jest.fn(),
			findBySubdomain: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TenantMiddleware,
				{
					provide: TenantsService,
					useValue: mockTenantService,
				},
			],
		}).compile();

		middleware = module.get<TenantMiddleware>(TenantMiddleware);
		tenantService = module.get(TenantsService);

		// Setup mocks
		mockRequest = {
			headers: {},
			get: jest.fn(),
		};
		mockResponse = {};
		mockNext = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Header-based tenant detection', () => {
		it('should find tenant by valid header ID', async () => {
			const mockTenant = { id: 1, name: 'Test School' } as TenantEntity;
			mockRequest.headers['x-tenant-id'] = '1';
			tenantService.findById.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, mockNext);

			expect(tenantService.findById).toHaveBeenCalledWith(1);
			expect(mockRequest.tenant).toBe(mockTenant);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should throw NotFoundException for invalid header ID', async () => {
			mockRequest.headers['x-tenant-id'] = '999';
			tenantService.findById.mockRejectedValue(
				new NotFoundException('Tenant with ID 999 not found'),
			);

			// PROBLEMA: Tu middleware actual captura esta excepción
			await expect(
				middleware.use(mockRequest, mockResponse, mockNext),
			).rejects.toThrow(NotFoundException);

			expect(tenantService.findById).toHaveBeenCalledWith(999);
			expect(mockNext).not.toHaveBeenCalled;
		});

		it('should ignore invalid header format', async () => {
			mockRequest.headers['x-tenant-id'] = 'invalid';
			mockRequest.get.mockReturnValue('demo.tuapp.com');

			const mockTenant = { id: 1, subdomain: 'demo' } as TenantEntity;
			tenantService.findBySubdomain.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, mockNext);

			expect(tenantService.findById).not.toHaveBeenCalled();
			expect(tenantService.findBySubdomain).toHaveBeenCalledWith('demo');
			expect(mockRequest.tenant).toBe(mockTenant);
		});
	});

	describe('Subdomain-based tenant detection', () => {
		beforeEach(() => {
			// No header present
			mockRequest.headers = {};
		});

		it('should find tenant by valid subdomain', async () => {
			const mockTenant = { id: 1, subdomain: 'demo' } as TenantEntity;
			mockRequest.get.mockReturnValue('demo.tuapp.com');
			tenantService.findBySubdomain.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, mockNext);

			expect(tenantService.findBySubdomain).toHaveBeenCalledWith('demo');
			expect(mockRequest.tenant).toBe(mockTenant);
			expect(mockNext).toHaveBeenCalled();
		});

		it('should handle subdomain with port', async () => {
			const mockTenant = { id: 1, subdomain: 'demo' } as TenantEntity;
			mockRequest.get.mockReturnValue('demo.localhost:3000');
			tenantService.findBySubdomain.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, mockNext);

			expect(tenantService.findBySubdomain).toHaveBeenCalledWith('demo');
			expect(mockRequest.tenant).toBe(mockTenant);
		});

		it('should throw NotFoundException for invalid subdomain', async () => {
			mockRequest.get.mockReturnValue('nonexistent.tuapp.com');
			tenantService.findBySubdomain.mockResolvedValue(null);

			// Con tu implementación actual, esto se captura silenciosamente
			expect(middleware.use(mockRequest, mockResponse, mockNext)).rejects.toThrow(
				NotFoundException,
			);

			expect(tenantService.findBySubdomain).toHaveBeenCalledWith('nonexistent');
			expect(mockRequest.tenant).toBeUndefined();
		});
	});

	describe('Special cases', () => {
		beforeEach(() => {
			mockRequest.headers = {};
		});

		const specialCases = [
			'www.tuapp.com',
			'localhost:3000',
			'api.tuapp.com',
			'admin.tuapp.com',
			'tuapp.com',
		];

		specialCases.forEach((host) => {
			it(`should skip tenant detection for ${host}`, async () => {
				mockRequest.get.mockReturnValue(host);

				await middleware.use(mockRequest, mockResponse, mockNext);

				expect(tenantService.findBySubdomain).not.toHaveBeenCalled();
				expect(mockRequest.tenant).toBeUndefined();
				expect(mockNext).toHaveBeenCalled();
			});
		});
	});

	//TODO: Check if is possible to check db handling err
	/* describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      mockRequest.headers['x-tenant-id'] = '1';
      tenantService.findById.mockRejectedValue(new Error('Database error'));

      await middleware.use(mockRequest, mockResponse, mockNext);

      // Con tu implementación actual, los errores se capturan
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.tenant).toBeUndefined();
    });
  }); */
});
