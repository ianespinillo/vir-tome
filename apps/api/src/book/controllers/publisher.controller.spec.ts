import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/publishers/controllers/publisher.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreatePublisherDto, UpdatePublisherDto } from '@repo/common';
import { PublisherEntity } from '../entities/publisher.entity';
import { PublisherService } from '../services/publisher.service';
import { PublisherController } from './publisher.controller';

describe('PublisherController', () => {
	let controller: PublisherController;
	let publisherService: PublisherService;

	const mockTenant: TenantEntity = {
		id: 1,
		name: 'Test Tenant',
		subdomain: 'test.com',
		contact_email: 'aaa@ex.com',
		is_active: true,
		is_demo: false,
		settings: {},
		plan: 'basic',
		created_at: new Date(),
		updated_at: new Date(),
		canAddResource: () => true,
		isActiveAndValid: () => true,
	};

	const mockPublisher: PublisherEntity = {
		id: 1,
		name: 'Test Publisher',
		tenant_id: 1,
		created_at: new Date(),
		updated_at: new Date(),
		books: [],
		tenant: mockTenant,
	};

	const mockPublisherService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findById: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PublisherController],
			providers: [
				{
					provide: PublisherService,
					useValue: mockPublisherService,
				},
			],
		}).compile();

		controller = module.get<PublisherController>(PublisherController);
		publisherService = module.get<PublisherService>(PublisherService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a publisher successfully', async () => {
			const createPublisherDto: CreatePublisherDto = {
				name: 'New Publisher',
			};

			mockPublisherService.create.mockResolvedValue(mockPublisher);

			const result = await controller.create(mockTenant, createPublisherDto);

			expect(publisherService.create).toHaveBeenCalledWith(1, createPublisherDto);
			expect(result).toEqual(mockPublisher);
		});

		it('should throw BadRequestException for duplicate publisher name', async () => {
			const createPublisherDto: CreatePublisherDto = {
				name: 'Duplicate Publisher',
			};

			mockPublisherService.create.mockRejectedValue(
				new BadRequestException('Publisher already exists'),
			);

			await expect(
				controller.create(mockTenant, createPublisherDto),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('findAll', () => {
		it('should return all publishers', async () => {
			const publishers = [mockPublisher];

			mockPublisherService.findAll.mockResolvedValue(publishers);

			const result = await controller.findAll(mockTenant);

			expect(publisherService.findAll).toHaveBeenCalledWith(1);
			expect(result).toEqual(publishers);
		});

		it('should return empty array when no publishers', async () => {
			mockPublisherService.findAll.mockResolvedValue([]);

			const result = await controller.findAll(mockTenant);

			expect(result).toEqual([]);
		});
	});

	describe('findOne', () => {
		it('should return publisher by id', async () => {
			mockPublisherService.findById.mockResolvedValue(mockPublisher);

			const result = await controller.findOne(mockTenant, 1);

			expect(publisherService.findById).toHaveBeenCalledWith(1, 1);
			expect(result).toEqual(mockPublisher);
		});

		it('should throw NotFoundException for non-existent publisher', async () => {
			mockPublisherService.findById.mockRejectedValue(new NotFoundException());

			await expect(controller.findOne(mockTenant, 999)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		it('should update publisher successfully', async () => {
			const updatePublisherDto: UpdatePublisherDto = {
				id: 1,
				name: 'Updated Publisher',
			};

			mockPublisherService.update.mockResolvedValue(undefined);

			await controller.update(mockTenant, 1, updatePublisherDto);

			expect(publisherService.update).toHaveBeenCalledWith(
				1,
				1,
				updatePublisherDto,
			);
		});

		it('should throw NotFoundException when updating non-existent publisher', async () => {
			const updatePublisherDto: UpdatePublisherDto = { id: 999, name: 'Updated' };

			mockPublisherService.update.mockRejectedValue(new NotFoundException());

			await expect(
				controller.update(mockTenant, 999, updatePublisherDto),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete publisher successfully', async () => {
			mockPublisherService.delete.mockResolvedValue(undefined);

			await controller.remove(mockTenant, 1);

			expect(publisherService.delete).toHaveBeenCalledWith(1, 1);
		});

		it('should throw BadRequestException when publisher has books', async () => {
			mockPublisherService.delete.mockRejectedValue(
				new BadRequestException('Publisher has books'),
			);

			await expect(controller.remove(mockTenant, 1)).rejects.toThrow(
				BadRequestException,
			);
		});
	});
});
