import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { UsersService } from '@/users/services/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/categories/controllers/category.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
	CreateCategoryDto,
	IApiResponse,
	IPaginatedResponse,
	UpdateCategoryDto,
} from '@repo/common';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';
import { CategoryController } from './category.controller';

describe('CategoryController', () => {
	let controller: CategoryController;
	let categoryService: CategoryService;

	const mockTenant: TenantEntity = {
		id: 1,
		name: 'Test Tenant',
		subdomain: 'test.com',
		contact_email: 'abc@tenant.com',
		created_at: new Date(),
		updated_at: new Date(),
		is_active: true,
		is_demo: false,
		settings: {},
		plan: 'basic',
		canAddResource: () => true,
		isActiveAndValid: () => true,
	};

	const mockCategory: CategoryEntity = {
		id: 1,
		name: 'Mathematics',
		created_at: new Date(),
		updated_at: new Date(),
		books: [],
	};
	const controllerResponse: IApiResponse<any> = {
		message: expect.any(String),
		data: null,
		timestamp: expect.any(String),
		status: expect.any(Number),
	};

	const mockCategoryService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findByPage: jest.fn(),
		findById: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CategoryController],
			providers: [
				{
					provide: CategoryService,
					useValue: mockCategoryService,
				},
				{
					provide: UsersService,
					useValue: {},
				},
			],
		}).compile();
		controllerResponse.data = null;
		controller = module.get<CategoryController>(CategoryController);
		categoryService = module.get<CategoryService>(CategoryService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a category successfully', async () => {
			const createCategoryDto: CreateCategoryDto = {
				name: 'Science',
			};

			mockCategoryService.create.mockResolvedValue(mockCategory);

			const result = await controller.create(createCategoryDto);
			controllerResponse.data = mockCategory;
			expect(categoryService.create).toHaveBeenCalledWith(createCategoryDto);
			expect(result).toEqual(controllerResponse);
		});

		it('should throw BadRequestException for invalid data', async () => {
			const createCategoryDto: CreateCategoryDto = {
				name: '',
			};

			mockCategoryService.create.mockRejectedValue(new BadRequestException());

			await expect(controller.create(createCategoryDto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('findAll', () => {
		it('should return paginated categories by default', async () => {
			const paginatedResult: IPaginatedResponse<any> = {
				items: [mockCategory],
				meta: { total: 1, current_page: 1, last_page: 1, per_page: 10 },
			};
			const serviceResult = {
				data: [mockCategory],
				total: 1,
				current_page: 1,
				last_page: 1,
				per_page: 1,
				skip: 0,
				to: 1,
			};
			mockCategoryService.findByPage.mockResolvedValue(serviceResult);

			controllerResponse.data = paginatedResult;
			const result = await controller.findAll(1, false);
			expect(categoryService.findByPage).toHaveBeenCalledWith(1, 1);
			expect(result.data).toEqual(controllerResponse.data);
		});

		it('should return all categories when full=true', async () => {
			const allCategories = [mockCategory];

			mockCategoryService.findAll.mockResolvedValue(allCategories);

			const result = await controller.findAll(1, true);
			controllerResponse.data = allCategories;
			expect(categoryService.findAll).toHaveBeenCalledWith(1);
			expect(result).toEqual(controllerResponse);
		});
	});

	describe('findOne', () => {
		it('should return category by id', async () => {
			mockCategoryService.findById.mockResolvedValue(mockCategory);

			const result = await controller.findOne(1);
			controllerResponse.data = mockCategory;
			expect(categoryService.findById).toHaveBeenCalledWith(1);
			expect(result).toEqual(controllerResponse);
		});

		it('should throw NotFoundException for non-existent category', async () => {
			mockCategoryService.findById.mockRejectedValue(new NotFoundException());

			await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		it('should update category successfully', async () => {
			const updateCategoryDto: UpdateCategoryDto = {
				id: 1,
				name: 'Updated Category',
			};

			mockCategoryService.update.mockResolvedValue(undefined);

			await controller.update(1, updateCategoryDto);

			expect(categoryService.update).toHaveBeenCalledWith(1, updateCategoryDto);
		});

		it('should throw NotFoundException when updating non-existent category', async () => {
			const updateCategoryDto: UpdateCategoryDto = { name: 'Updated', id: 999 };

			mockCategoryService.update.mockRejectedValue(new NotFoundException());

			await expect(controller.update(999, updateCategoryDto)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('remove', () => {
		it('should delete category successfully', async () => {
			mockCategoryService.delete.mockResolvedValue(undefined);

			await controller.remove(1);

			expect(categoryService.delete).toHaveBeenCalledWith(1);
		});

		it('should throw BadRequestException when category has books', async () => {
			mockCategoryService.delete.mockRejectedValue(
				new BadRequestException('Category has books'),
			);

			await expect(controller.remove(1)).rejects.toThrow(BadRequestException);
		});
	});
});
