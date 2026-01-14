import { UsersService } from '@/users/services/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/publishers/controllers/publisher.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
	CreatePublisherDto,
	IApiResponse,
	IPaginatedResponse,
	UpdatePublisherDto,
} from '@repo/common';
import { PublisherEntity } from '../entities/publisher.entity';
import { PublisherService } from '../services/publisher.service';
import { PublisherController } from './publisher.controller';

describe('PublisherController', () => {
	let controller: PublisherController;
	let publisherService: PublisherService;

	const mockPublisher: PublisherEntity = {
		id: 1,
		name: 'Test Publisher',
		created_at: new Date(),
		updated_at: new Date(),
		books: [],
	};

	const mockPublisherService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findById: jest.fn(),
		update: jest.fn(),
		createPublisher: jest.fn(),
		getPaginated: jest.fn(),
		delete: jest.fn(),
	};
	const controllerResponse: IApiResponse<any> = {
		message: expect.any(String),
		data: null,
		timestamp: expect.any(String),
		status: expect.any(Number),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PublisherController],
			providers: [
				{
					provide: PublisherService,
					useValue: mockPublisherService,
				},
				{
					provide: UsersService,
					useValue: {},
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

			mockPublisherService.createPublisher.mockResolvedValue(mockPublisher);

			const result = await controller.create(createPublisherDto);
			controllerResponse.data = mockPublisher;
			expect(publisherService.createPublisher).toHaveBeenCalledWith(
				createPublisherDto,
			);
			expect(result).toEqual(controllerResponse);
		});

		it('should throw BadRequestException for duplicate publisher name', async () => {
			const createPublisherDto: CreatePublisherDto = {
				name: 'Duplicate Publisher',
			};

			mockPublisherService.createPublisher.mockRejectedValue(
				new BadRequestException('Publisher already exists'),
			);

			await expect(controller.create(createPublisherDto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('findAll', () => {
		it('should return all publishers', async () => {
			const publishers: IPaginatedResponse<Partial<PublisherEntity>> = {
				items: [mockPublisher],
				meta: { per_page: 1, current_page: 1, total: 1, last_page: 1 },
			};

			mockPublisherService.getPaginated.mockResolvedValue(publishers);

			const result = await controller.findAll();
			controllerResponse.data = publishers;
			expect(publisherService.getPaginated).toHaveBeenCalled();
			expect(result).toEqual(controllerResponse);
		});

		it('should return empty array when no publishers', async () => {
			const publishers: IPaginatedResponse<Partial<PublisherEntity>> = {
				items: [],
				meta: { per_page: 1, current_page: 1, total: 0, last_page: 1 },
			};
			mockPublisherService.getPaginated.mockResolvedValue(publishers);

			const result = await controller.findAll();
			controllerResponse.data = publishers;
			expect(result).toEqual(controllerResponse);
		});
	});

	describe('findOne', () => {
		it('should return publisher by id', async () => {
			mockPublisherService.findById.mockResolvedValue(mockPublisher);

			const result = await controller.findOne(1);
			controllerResponse.data = mockPublisher;
			expect(publisherService.findById).toHaveBeenCalledWith(1);
			expect(result).toEqual(controllerResponse);
		});

		it('should throw NotFoundException for non-existent publisher', async () => {
			mockPublisherService.findById.mockRejectedValue(new NotFoundException());

			await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('should update publisher successfully', async () => {
			const updatePublisherDto: UpdatePublisherDto = {
				id: 1,
				name: 'Updated Publisher',
			};

			mockPublisherService.update.mockResolvedValue(undefined);

			await controller.update(1, updatePublisherDto);

			expect(publisherService.update).toHaveBeenCalledWith(1, updatePublisherDto);
		});

		it('should throw NotFoundException when updating non-existent publisher', async () => {
			const updatePublisherDto: UpdatePublisherDto = {
				id: 999,
				name: 'Updated',
			};

			mockPublisherService.update.mockRejectedValue(new NotFoundException());

			await expect(controller.update(999, updatePublisherDto)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('remove', () => {
		it('should delete publisher successfully', async () => {
			mockPublisherService.delete.mockResolvedValue(undefined);

			await controller.remove(1);

			expect(publisherService.delete).toHaveBeenCalledWith(1);
		});

		it('should throw BadRequestException when publisher has books', async () => {
			mockPublisherService.delete.mockRejectedValue(
				new BadRequestException('Publisher has books'),
			);

			await expect(controller.remove(1)).rejects.toThrow(BadRequestException);
		});
	});
});
