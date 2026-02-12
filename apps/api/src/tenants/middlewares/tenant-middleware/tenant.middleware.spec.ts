import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ExtendedRequest } from '../../../core/core.types';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantMiddleware } from './tenant.middleware'; // Ajusta la ruta

describe('TenantMiddleware', () => {
	let middleware: TenantMiddleware;
	let tenantsService: TenantsService;

	const mockTenantsService = {
		findById: jest.fn(),
		findBySubdomain: jest.fn(),
	};

	const mockResponse = {} as Response;
	const nextFunction = jest.fn();

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TenantMiddleware,
				{
					provide: TenantsService,
					useValue: mockTenantsService,
				},
			],
		}).compile();

		middleware = module.get<TenantMiddleware>(TenantMiddleware);
		tenantsService = module.get<TenantsService>(TenantsService);
		jest.clearAllMocks();
	});

	describe('Detección por Cabecera (x-tenant-id)', () => {
		it('debería asignar el tenant si la cabecera es válida y el tenant está activo', async () => {
			const mockTenant = { id: 1, name: 'Tenant A', is_active: true };
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			mockTenantsService.findById.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, nextFunction);

			expect(mockRequest.tenant).toEqual(mockTenant);
			expect(mockRequest.tenantId).toBe(1);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('debería lanzar NotFoundException si el ID de la cabecera no existe', async () => {
			const mockRequest = {
				headers: { 'x-tenant-id': '99' },
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			mockTenantsService.findById.mockResolvedValue(null);

			await expect(
				middleware.use(mockRequest, mockResponse, nextFunction),
			).rejects.toThrow(new NotFoundException('Tenant with ID 99 not found'));
		});
	});

	describe('Detección por Subdominio', () => {
		it('debería extraer y asignar el tenant desde el host (formato vir-tome.local)', async () => {
			const mockTenant = { id: 2, name: 'Empresa B', is_active: true };
			const mockRequest = {
				headers: {},
				get: jest.fn().mockReturnValue('empresa-b.vir-tome.local'),
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			mockTenantsService.findBySubdomain.mockResolvedValue(mockTenant);

			await middleware.use(mockRequest, mockResponse, nextFunction);

			expect(mockTenantsService.findBySubdomain).toHaveBeenCalledWith('empresa-b');
			expect(mockRequest.tenantId).toBe(2);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('debería ignorar casos especiales como "www" o "api"', async () => {
			const mockRequest = {
				headers: {},
				get: jest.fn().mockReturnValue('www.vir-tome.local'),
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			await middleware.use(mockRequest, mockResponse, nextFunction);

			expect(mockTenantsService.findBySubdomain).not.toHaveBeenCalled();
			expect(mockRequest.tenant).toBeUndefined();
			expect(nextFunction).toHaveBeenCalled();
		});

		it('debería lanzar NotFoundException si el subdominio no existe en la DB', async () => {
			const mockRequest = {
				headers: {},
				get: jest.fn().mockReturnValue('desconocido.vir-tome.local'),
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			mockTenantsService.findBySubdomain.mockResolvedValue(null);

			await expect(
				middleware.use(mockRequest, mockResponse, nextFunction),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('Validación de Estado', () => {
		it('debería lanzar BadRequestException si el tenant está inactivo', async () => {
			const mockTenant = { id: 1, name: 'Bloqueado', is_active: false };
			const mockRequest = {
				headers: { 'x-tenant-id': '1' },
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			mockTenantsService.findById.mockResolvedValue(mockTenant);

			await expect(
				middleware.use(mockRequest, mockResponse, nextFunction),
			).rejects.toThrow(new BadRequestException('Tenant "Bloqueado" is inactive'));
		});
	});

	describe('Flujo General', () => {
		it('debería continuar (next) si no hay cabecera ni subdominio válido', async () => {
			const mockRequest = {
				headers: {},
				get: jest.fn().mockReturnValue('localhost'),
				tenant: undefined as any,
				tenantId: undefined as any,
				user: { tenant: undefined as any } as any,
			} as unknown as ExtendedRequest;

			await middleware.use(mockRequest, mockResponse, nextFunction);

			expect(nextFunction).toHaveBeenCalled();
			expect(mockRequest.tenant).toBeUndefined();
		});
	});
});
