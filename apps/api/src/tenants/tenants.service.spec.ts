import { EmailService } from '@/email/email.service';
import { RoleEntity } from '@/users/entities/role.entity';
import { UserTenantEntity } from '@/users/entities/user-tenant.entity';
import { UserEntity } from '@/users/entities/user.entity';
import { RoleService } from '@/users/services/role.service';
import { UsersService } from '@/users/services/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateTenantDto, ROLES, SignUpDto } from '@repo/common';
import { Repository } from 'typeorm';
import { TenantEntity } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
	let service: TenantsService;
	let repository: Repository<TenantEntity>;

	const mockRepository = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		count: jest.fn(),
	};
	jest.mock('typeorm', () => {
		const actual = jest.requireActual('typeorm');
		return {
			...actual,
			IsNull: jest.fn().mockReturnValue({ _type: 'isNull' }),
		};
	});
	const mockUserService = {
		find: jest.fn(),
		create: jest.fn(),
	};
	const mockEmailService = {
		sendEmailWelcome: jest.fn(),
	};
	const mockRoleService = {
		initializeDefaultRoles: jest.fn(),
		findRoleByName: jest.fn(),
	};
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TenantsService,
				{
					provide: getRepositoryToken(TenantEntity),
					useValue: mockRepository,
				},

				{
					provide: RoleService,
					useValue: mockRoleService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: UsersService,
					useValue: mockUserService,
				},
			],
		}).compile();

		service = module.get<TenantsService>(TenantsService);
		repository = module.get<Repository<TenantEntity>>(
			getRepositoryToken(TenantEntity),
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		const createTenantDto: CreateTenantDto = {
			subdomain: 'test-school',
			name: 'Test School',
			contact_email: 'admin@test-school.com',
		} as CreateTenantDto;
		const mockAdmin: Partial<UserEntity> = {
			email: 'admin@email.com',
			name: 'admin',
			surname: 'doe',
			userTenants: [
				{
					role: { id: 1, name: ROLES.ADMIN } as unknown as RoleEntity,
				} as unknown as UserTenantEntity,
			],
		};

		it('should create a tenant successfully', async () => {
			const savedTenant = {
				id: 1,
				...createTenantDto,
				is_active: true,
				is_demo: false,
				plan: 'basic',
				settings: {
					theme: 'light',
					features: ['basic_library'],
					school_info: {},
					limits: {
						max_books: 1000,
						max_users: 50,
						max_loans: 100,
					},
				},
			};

			mockRepository.findOne
				.mockResolvedValueOnce(null) // No existing subdomain
				.mockResolvedValueOnce(null); // No existing email
			mockRepository.create.mockReturnValue(savedTenant);
			mockRepository.save.mockResolvedValue(savedTenant);
			mockRoleService.findRoleByName.mockResolvedValue(ROLES.ADMIN);
			mockUserService.create.mockResolvedValue({
				user: mockAdmin,
			});
			const result = await service.create(createTenantDto);

			expect(result).toEqual(savedTenant);
			expect(mockEmailService.sendEmailWelcome).toHaveBeenCalled();
			expect(mockRoleService.initializeDefaultRoles).toHaveBeenCalled();
			expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
			expect(mockRepository.save).toHaveBeenCalledWith(savedTenant);
		});

		it('should throw BadRequestException if subdomain exists', async () => {
			const existingTenant = { id: 1, subdomain: 'test-school' };
			mockRepository.findOne.mockResolvedValueOnce(existingTenant);

			await expect(service.create(createTenantDto)).rejects.toThrow(
				new BadRequestException(
					`Subdomain '${createTenantDto.subdomain}' already exists`,
				),
			);
		});

		it('should throw BadRequestException if email exists', async () => {
			const existingTenant = { id: 1, contact_email: 'admin@test-school.com' };
			mockRepository.findOne
				.mockResolvedValueOnce(null) // No existing subdomain
				.mockResolvedValueOnce(existingTenant); // Existing email

			await expect(service.create(createTenantDto)).rejects.toThrow(
				new BadRequestException(
					`Email '${createTenantDto.contact_email}' already exists`,
				),
			);
		});
	});

	describe('findBySubdomain', () => {
		it('should return tenant by subdomain', async () => {
			const tenant = {
				id: 1,
				subdomain: 'test-school',
				is_active: true,
				subscription_expires_at: null,
				isActiveAndValid: jest.fn().mockReturnValue(true),
			};

			mockRepository.findOne.mockResolvedValue(tenant);

			const result = await service.findBySubdomain('test-school');

			expect(result).toEqual(tenant);
			expect(mockRepository.findOne).toHaveBeenCalledWith({
				where: { subdomain: 'test-school', deleted_at: expect.any(Object) },
			});
		});

		it('should throw NotFoundException if tenant not found', async () => {
			mockRepository.findOne.mockResolvedValue(null);

			await expect(service.findBySubdomain('nonexistent')).rejects.toThrow(
				new NotFoundException(`Tenant with subdomain 'nonexistent' not found`),
			);
		});

		it('should throw BadRequestException if tenant is not active', async () => {
			const tenant = {
				id: 1,
				subdomain: 'test-school',
				isActiveAndValid: jest.fn().mockReturnValue(false),
			};

			mockRepository.findOne.mockResolvedValue(tenant);

			await expect(service.findBySubdomain('test-school')).rejects.toThrow(
				new BadRequestException(
					`Tenant 'test-school' is not active or subscription expired`,
				),
			);
		});
	});

	describe('getStats', () => {
		it('should return tenant statistics', async () => {
			mockRepository.count
				.mockResolvedValueOnce(10) // total
				.mockResolvedValueOnce(8) // active
				.mockResolvedValueOnce(2); // demo

			const result = await service.getStats();

			expect(result).toEqual({
				total: 10,
				active: 8,
				inactive: 2,
				demo: 2,
				production: 8,
			});
		});
	});
});
