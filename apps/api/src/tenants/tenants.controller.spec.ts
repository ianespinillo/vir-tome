import { EmailService } from '@/email/email.service';
import { RoleService } from '@/users/services/role.service';
import { UsersService } from '@/users/services/users.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTenantDto, IApiResponse } from '@repo/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

describe('TenantsController', () => {
	let controller: TenantsController;
	let service: TenantsService;

	const mockTenantsService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findActive: jest.fn(),
		findById: jest.fn(),
		findBySubdomain: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		activate: jest.fn(),
		deactivate: jest.fn(),
		getStats: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TenantsController],
			providers: [
				{
					provide: TenantsService,
					useValue: mockTenantsService,
				},
			],
		}).compile();

		controller = module.get<TenantsController>(TenantsController);
		service = module.get<TenantsService>(TenantsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a tenant', async () => {
			const createTenantDto = {
				subdomain: 'test-school',
				name: 'Test School',
				contact_email: 'admin@test-school.com',
			};

			const createdTenant = { id: 1, ...createTenantDto };
			mockTenantsService.create.mockResolvedValue(createdTenant);

			const result = await controller.create(createTenantDto as CreateTenantDto);

			expect(result).toEqual({
				message: 'Tenant created successfully',
				data: createdTenant,
				status: HttpStatus.CREATED,
				timestamp: expect.any(String),
			});
			expect(service.create).toHaveBeenCalledWith(createTenantDto);
		});
	});

	describe('findBySubdomain', () => {
		it('should return tenant by subdomain', async () => {
			const tenant = { id: 1, subdomain: 'test-school' };
			mockTenantsService.findBySubdomain.mockResolvedValue(tenant);

			const result = await controller.findBySubdomain('test-school');

			expect(result).toEqual({
				message: 'Tenant retrieved successfully',
				data: tenant,
				status: HttpStatus.OK,
				timestamp: expect.any(String),
			});
			expect(service.findBySubdomain).toHaveBeenCalledWith('test-school');
		});
	});

	describe('getStats', () => {
		it('should return tenant statistics', async () => {
			const stats = { total: 10, active: 8, inactive: 2, demo: 2, production: 8 };
			mockTenantsService.getStats.mockResolvedValue(stats);

			const result = await controller.getStats();

			expect(result).toEqual({
				message: 'Tenant statistics retrieved successfully',
				data: stats,
				status: HttpStatus.OK,
				timestamp: expect.any(String),
			});
			expect(service.getStats).toHaveBeenCalled();
		});
	});
});
