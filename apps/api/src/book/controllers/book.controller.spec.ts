import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/books/controllers/book.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreateBookDto, UpdateBookDto, UpdateStockDto } from '@repo/common';
import { BookEntity } from '../entities/book.entity';
import { PublisherEntity } from '../entities/publisher.entity';
import { BookService } from '../services/book.service';
import { BookController } from './book.controller';

describe('BookController', () => {
	let controller: BookController;
	let bookService: BookService;

	const mockTenant: TenantEntity = {
		id: 1,
		name: 'Test Tenant',
		subdomain: 'test.com',
		contact_email: 'abc@example.com',
		is_active: true,
		is_demo: false,
		created_at: new Date(),
		updated_at: new Date(),
		settings: {},
		plan: 'basic',
		canAddResource: () => true,
		isActiveAndValid: () => true,
	};

	const mockBook: BookEntity = {
		id: 1,
		title: 'Test Book',
		tenant_id: 1,
		created_at: new Date(),
		updated_at: new Date(),
		availableQuantity: 10,
		loans: [],
		publicationYear: 2020,
		tenant: mockTenant,
		categories: [],
		publisher: {} as PublisherEntity,
	};

	const mockBookService = {
		createBook: jest.fn(),
		updateStock: jest.fn(),
		updateBook: jest.fn(),
		findAll: jest.fn(),
		findByPage: jest.fn(),
		findBookByName: jest.fn(),
		findOneBook: jest.fn(),
		delete: jest.fn(),
		findAllWithDetailsPaginated: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [BookController],
			providers: [
				{
					provide: BookService,
					useValue: mockBookService,
				},
			],
		}).compile();

		controller = module.get<BookController>(BookController);
		bookService = module.get<BookService>(BookService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should create a book successfully', async () => {
			const createBookDto: CreateBookDto = {
				title: 'New Book',
				publisherId: 1,
				availableQuantity: 5,
				categoryIds: [1, 2],
				publicationYear: 2021,
			};

			mockBookService.createBook.mockResolvedValue(mockBook);

			const result = await controller.create(mockTenant, createBookDto);

			expect(bookService.createBook).toHaveBeenCalledWith(1, createBookDto);
			expect(result).toEqual(mockBook);
		});

		it('should throw BadRequestException when service fails', async () => {
			const createBookDto: CreateBookDto = {
				title: 'New Book',
				publisherId: 1,
				availableQuantity: 5,
				categoryIds: [1, 2],
				publicationYear: 2021,
			};

			mockBookService.createBook.mockRejectedValue(
				new BadRequestException('Invalid data'),
			);

			await expect(controller.create(mockTenant, createBookDto)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('updateStock', () => {
		it('should update book stock successfully', async () => {
			const updateStockDto: UpdateStockDto = { quantity: 5, id: 1 };
			const updatedBook = { ...mockBook, stock: 15 };

			mockBookService.updateStock.mockResolvedValue(updatedBook);

			const result = await controller.updateStock(mockTenant, 1, updateStockDto);

			expect(bookService.updateStock).toHaveBeenCalledWith(mockTenant.id, 1, 5);
			expect(result).toEqual(updatedBook);
		});

		it('should throw NotFoundException for non-existent book', async () => {
			const updateStockDto: UpdateStockDto = { quantity: 5, id: 999 };

			mockBookService.updateStock.mockRejectedValue(
				new NotFoundException('Book not found'),
			);

			await expect(
				controller.updateStock(mockTenant, 999, updateStockDto),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateBook', () => {
		it('should update book details successfully', async () => {
			const updateBookDto: UpdateBookDto = {
				title: 'Updated Title',
				publicationYear: 2022,
				availableQuantity: 20,
				categoryIds: [1, 3],
				publisherId: 2,
			};
			const updatedBook = { ...mockBook, ...updateBookDto };

			mockBookService.updateBook.mockResolvedValue(updatedBook);

			const result = await controller.updateBook(mockTenant, 1, updateBookDto);

			expect(bookService.updateBook).toHaveBeenCalledWith(1, 1, updateBookDto);
			expect(result).toEqual(updatedBook);
		});
	});

	describe('findAll', () => {
		it('should return paginated books when no parameters', async () => {
			const paginatedResult = {
				data: [mockBook],
				meta: { total: 1, page: 1, lastPage: 1, perPage: 10 },
			};

			mockBookService.findAllWithDetailsPaginated.mockResolvedValue(
				paginatedResult,
			);

			const result = await controller.findAll(mockTenant, 1, false);

			expect(bookService.findAllWithDetailsPaginated).toHaveBeenCalledWith(1, 1);
			expect(result).toEqual(paginatedResult);
		});

		it('should return all books when full=true', async () => {
			const allBooks = [mockBook];

			mockBookService.findAll.mockResolvedValue(allBooks);

			const result = await controller.findAll(mockTenant, 1, true);

			expect(bookService.findAll).toHaveBeenCalledWith(1);
			expect(result).toEqual(allBooks);
		});

		it('should search books when search parameter provided', async () => {
			const searchResult = [mockBook];

			mockBookService.findBookByName.mockResolvedValue(searchResult);

			const result = await controller.findAll(mockTenant, 1, false, 'test');

			expect(bookService.findBookByName).toHaveBeenCalledWith(1, 'test');
			expect(result).toEqual(searchResult);
		});
	});

	describe('findById', () => {
		it('should return book by id', async () => {
			mockBookService.findOneBook.mockResolvedValue(mockBook);

			const result = await controller.findById(mockTenant, 1);

			expect(bookService.findOneBook).toHaveBeenCalledWith(1, 1);
			expect(result).toEqual(mockBook);
		});

		it('should throw NotFoundException for non-existent book', async () => {
			mockBookService.findOneBook.mockRejectedValue(new NotFoundException());

			await expect(controller.findById(mockTenant, 999)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('remove', () => {
		it('should delete book successfully', async () => {
			mockBookService.delete.mockResolvedValue(undefined);

			await controller.remove(mockTenant, 1);

			expect(bookService.delete).toHaveBeenCalledWith(1, 1);
		});

		it('should throw NotFoundException when deleting non-existent book', async () => {
			mockBookService.delete.mockRejectedValue(new NotFoundException());

			await expect(controller.remove(mockTenant, 999)).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
