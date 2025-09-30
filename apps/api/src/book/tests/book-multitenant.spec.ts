import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/book/__tests__/books-multitenant.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBookDto } from '@repo/common';
import { DataSource } from 'typeorm';
import { testDatabaseConfig } from '../../__tests__/database-test.config';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { BookEntity } from '../entities/book.entity';
import { CategoryEntity } from '../entities/category.entity';
import { PublisherEntity } from '../entities/publisher.entity';
import { BookService } from '../services/book.service';
import { CategoryService } from '../services/category.service';
import { PublisherService } from '../services/publisher.service';

describe('Books Multi-tenant Integration', () => {
	let app: TestingModule;
	let dataSource: DataSource;
	let bookService: BookService;
	let categoryService: CategoryService;
	let publisherService: PublisherService;
	let tenantRepository: any;

	let tenant1: TenantEntity;
	let tenant2: TenantEntity;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig),
				TypeOrmModule.forFeature([
					TenantEntity,
					BookEntity,
					CategoryEntity,
					PublisherEntity,
				]),
			],
			providers: [BookService, CategoryService, PublisherService],
		}).compile();

		dataSource = app.get<DataSource>(DataSource);
		bookService = app.get<BookService>(BookService);
		categoryService = app.get<CategoryService>(CategoryService);
		publisherService = app.get<PublisherService>(PublisherService);
		tenantRepository = dataSource.getRepository(TenantEntity);

		// Crear tenants de prueba
		tenant1 = await tenantRepository.save({
			subdomain: 'library-alpha',
			name: 'Alpha Library',
			contact_email: 'admin@alpha.lib',
			is_active: true,
		});

		tenant2 = await tenantRepository.save({
			subdomain: 'library-beta',
			name: 'Beta Library',
			contact_email: 'admin@beta.lib',
			is_active: true,
		});
	});

	afterAll(async () => {
		await dataSource.destroy();
		await app.close();
	});

	beforeEach(async () => {
		// Limpiar datos entre tests
		await dataSource.getRepository(BookEntity).delete({});
		await dataSource.getRepository(CategoryEntity).delete({});
		await dataSource.getRepository(PublisherEntity).delete({});
	});

	describe('Publisher Isolation', () => {
		test('should create publishers isolated by tenant', async () => {
			const publisher1 = await publisherService.create(tenant1.id, {
				name: 'Santillana',
			});

			const publisher2 = await publisherService.create(tenant2.id, {
				name: 'Santillana', // Mismo nombre, diferente tenant
			});

			expect(publisher1.name).toBe('Santillana');
			expect(publisher1.tenant_id).toBe(tenant1.id);

			expect(publisher2.name).toBe('Santillana');
			expect(publisher2.tenant_id).toBe(tenant2.id);
		});

		test('should find publishers only from specific tenant', async () => {
			await publisherService.create(tenant1.id, { name: 'Editorial Alpha' });
			await publisherService.create(tenant1.id, { name: 'Kapelusz' });
			await publisherService.create(tenant2.id, { name: 'Editorial Beta' });

			const tenant1Publishers = await publisherService.findAll(tenant1.id);
			const tenant2Publishers = await publisherService.findAll(tenant2.id);

			expect(tenant1Publishers).toHaveLength(2);
			expect(tenant1Publishers.every((p) => p.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(tenant2Publishers).toHaveLength(1);
			expect(tenant2Publishers[0].tenant_id).toBe(tenant2.id);
		});
	});

	describe('Category Isolation', () => {
		test('should create categories isolated by tenant', async () => {
			const category1 = await categoryService.create(tenant1.id, {
				name: 'Literatura Infantil',
			});

			const category2 = await categoryService.create(tenant2.id, {
				name: 'Literatura Infantil', // Mismo nombre
			});

			expect(category1.tenant_id).toBe(tenant1.id);
			expect(category2.tenant_id).toBe(tenant2.id);
		});

		test('should find categories only from specific tenant', async () => {
			const cat1 = await categoryService.create(tenant1.id, {
				name: 'Matemáticas',
			});
			const cat2 = await categoryService.create(tenant1.id, { name: 'Ciencias' });
			const cat3 = await categoryService.create(tenant2.id, { name: 'Historia' });

			const tenant1Categories = await categoryService.findAll(tenant1.id);
			const tenant2Categories = await categoryService.findAll(tenant2.id);

			expect(tenant1Categories).toHaveLength(2);
			expect(tenant1Categories.every((c) => c.tenant_id === tenant1.id)).toBe(
				true,
			);

			expect(tenant2Categories).toHaveLength(1);
			expect(tenant2Categories[0].tenant_id).toBe(tenant2.id);
		});

		test('should only find categories of specific tenant by IDs', async () => {
			const cat1 = await categoryService.create(tenant1.id, { name: 'Cat1' });
			const cat2 = await categoryService.create(tenant1.id, { name: 'Cat2' });
			const cat3 = await categoryService.create(tenant2.id, { name: 'Cat3' });

			// Buscar categorías de tenant1
			const foundCategories = await categoryService.findAllOfBook(
				tenant1.id,
				[cat1.id, cat2.id, cat3.id], // Incluye ID de otro tenant
			);

			// Solo debe retornar cat1 y cat2
			expect(foundCategories).toHaveLength(2);
			expect(foundCategories.every((c) => c.tenant_id === tenant1.id)).toBe(true);
			expect(foundCategories.map((c) => c.id).sort()).toEqual(
				[cat1.id, cat2.id].sort(),
			);
		});
	});

	describe('Book Isolation', () => {
		let publisher1: PublisherEntity;
		let publisher2: PublisherEntity;
		let category1: CategoryEntity;
		let category2: CategoryEntity;

		beforeEach(async () => {
			// Setup: Crear publishers y categories para cada tenant
			publisher1 = await publisherService.create(tenant1.id, {
				name: 'Publisher T1',
			});
			publisher2 = await publisherService.create(tenant2.id, {
				name: 'Publisher T2',
			});

			category1 = await categoryService.create(tenant1.id, {
				name: 'Category T1',
			});
			category2 = await categoryService.create(tenant2.id, {
				name: 'Category T2',
			});
		});

		test('should create books isolated by tenant', async () => {
			const bookDto1: CreateBookDto = {
				title: 'Matemática 4to',
				publicationYear: 2023,
				availableQuantity: 10,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			};

			const bookDto2: CreateBookDto = {
				title: 'Matemática 4to', // Mismo título
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher2.id,
				categoryIds: [category2.id],
			};

			const book1 = await bookService.createBook(tenant1.id, bookDto1);
			const book2 = await bookService.createBook(tenant2.id, bookDto2);

			expect(book1.title).toBe('Matemática 4to');
			expect(book1.tenant_id).toBe(tenant1.id);
			expect(book1.availableQuantity).toBe(10);

			expect(book2.title).toBe('Matemática 4to');
			expect(book2.tenant_id).toBe(tenant2.id);
			expect(book2.availableQuantity).toBe(5);
		});

		test('should prevent creating book with publisher from different tenant', async () => {
			const bookDto: CreateBookDto = {
				title: 'Hacked Book',
				publicationYear: 2023,
				availableQuantity: 1,
				publisherId: publisher2.id, // Publisher de tenant2
				categoryIds: [category1.id],
			};

			// Intentar crear en tenant1 con publisher de tenant2
			await expect(bookService.createBook(tenant1.id, bookDto)).rejects.toThrow(
				NotFoundException,
			);
		});

		test('should prevent creating book with categories from different tenant', async () => {
			const bookDto: CreateBookDto = {
				title: 'Hacked Book',
				publicationYear: 2023,
				availableQuantity: 1,
				publisherId: publisher1.id,
				categoryIds: [category2.id], // Category de tenant2
			};

			// Intentar crear en tenant1 con category de tenant2
			await expect(bookService.createBook(tenant1.id, bookDto)).rejects.toThrow(
				BadRequestException,
			);
		});

		test('should find books only from specific tenant', async () => {
			await bookService.createBook(tenant1.id, {
				title: 'Book Alpha 1',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			await bookService.createBook(tenant1.id, {
				title: 'Book Alpha 2',
				publicationYear: 2023,
				availableQuantity: 3,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			await bookService.createBook(tenant2.id, {
				title: 'Book Beta 1',
				publicationYear: 2023,
				availableQuantity: 7,
				publisherId: publisher2.id,
				categoryIds: [category2.id],
			});

			const tenant1Books = await bookService.findAll(tenant1.id);
			const tenant2Books = await bookService.findAll(tenant2.id);

			expect(tenant1Books).toHaveLength(2);
			expect(tenant1Books.every((b) => b.tenant_id === tenant1.id)).toBe(true);

			expect(tenant2Books).toHaveLength(1);
			expect(tenant2Books[0].tenant_id).toBe(tenant2.id);
		});

		test('should not find book from other tenant by ID', async () => {
			const book = await bookService.createBook(tenant1.id, {
				title: 'Private Book',
				publicationYear: 2023,
				availableQuantity: 1,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			// Tenant1 debe poder encontrarlo
			const foundByOwner = await bookService.findById(tenant1.id, book.id);
			expect(foundByOwner).toBeTruthy();

			// Tenant2 NO debe poder encontrarlo
			const foundByOther = await bookService.findById(tenant2.id, book.id);
			expect(foundByOther).toBeNull();
		});

		test('should handle stock operations with tenant isolation', async () => {
			const book1 = await bookService.createBook(tenant1.id, {
				title: 'Stock Book T1',
				publicationYear: 2023,
				availableQuantity: 10,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			const book2 = await bookService.createBook(tenant2.id, {
				title: 'Stock Book T2',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher2.id,
				categoryIds: [category2.id],
			});

			// Remover stock de book1 en tenant1
			await bookService.removeStock(tenant1.id, book1.id, 3);

			// Verificar que solo book1 cambió
			const updatedBook1 = await bookService.findById(tenant1.id, book1.id);
			const updatedBook2 = await bookService.findById(tenant2.id, book2.id);

			expect(updatedBook1?.availableQuantity).toBe(7);
			expect(updatedBook2?.availableQuantity).toBe(5); // No cambió
		});

		test('should paginate books with tenant isolation', async () => {
			// Crear 10 libros para tenant1
			for (let i = 1; i <= 10; i++) {
				await bookService.createBook(tenant1.id, {
					title: `Book T1 ${i}`,
					publicationYear: 2023,
					availableQuantity: i,
					publisherId: publisher1.id,
					categoryIds: [category1.id],
				});
			}

			// Crear 3 libros para tenant2
			for (let i = 1; i <= 3; i++) {
				await bookService.createBook(tenant2.id, {
					title: `Book T2 ${i}`,
					publicationYear: 2023,
					availableQuantity: i,
					publisherId: publisher2.id,
					categoryIds: [category2.id],
				});
			}

			const tenant1Page1 = await bookService.findAllWithDetailsPaginated(
				tenant1.id,
				1,
			);
			const tenant2Page1 = await bookService.findAllWithDetailsPaginated(
				tenant2.id,
				1,
			);

			expect(tenant1Page1.data).toHaveLength(6);
			expect(tenant1Page1.total).toBe(10);
			expect(tenant1Page1.last_page).toBe(2);

			expect(tenant2Page1.data).toHaveLength(3);
			expect(tenant2Page1.total).toBe(3);
			expect(tenant2Page1.last_page).toBe(1);
		});

		test('should search books by name with tenant isolation', async () => {
			await bookService.createBook(tenant1.id, {
				title: 'Matemática Moderna',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			await bookService.createBook(tenant2.id, {
				title: 'Matemática Avanzada',
				publicationYear: 2023,
				availableQuantity: 3,
				publisherId: publisher2.id,
				categoryIds: [category2.id],
			});

			const tenant1Results = await bookService.findBookByName(
				tenant1.id,
				'Matemática',
			);
			const tenant2Results = await bookService.findBookByName(
				tenant2.id,
				'Matemática',
			);

			expect(tenant1Results.data).toHaveLength(1);
			expect(tenant1Results.data[0].title).toBe('Matemática Moderna');

			expect(tenant2Results.data).toHaveLength(1);
			expect(tenant2Results.data[0].title).toBe('Matemática Avanzada');
		});

		test('should update book with tenant validation', async () => {
			const book = await bookService.createBook(tenant1.id, {
				title: 'Original Title',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			// Tenant1 puede actualizar
			const updated = await bookService.updateBook(tenant1.id, book.id, {
				title: 'Updated Title',
				publicationYear: 2024,
				availableQuantity: 10,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			});

			expect(updated.title).toBe('Updated Title');
			expect(updated.publicationYear).toBe(2024);
		});
	});

	describe('Complex Relationships', () => {
		test('should maintain referential integrity within tenant', async () => {
			const publisher = await publisherService.create(tenant1.id, {
				name: 'Test Publisher',
			});

			const cat1 = await categoryService.create(tenant1.id, { name: 'Cat 1' });
			const cat2 = await categoryService.create(tenant1.id, { name: 'Cat 2' });

			const book = await bookService.createBook(tenant1.id, {
				title: 'Complex Book',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher.id,
				categoryIds: [cat1.id, cat2.id],
			});

			const foundBook = await bookService.findOneBook(tenant1.id, book.id);

			expect(foundBook.publisherId).toBe(publisher.id);
			expect(foundBook.categoriesIds).toHaveLength(2);
			expect(foundBook.categoriesIds.sort()).toEqual([cat1.id, cat2.id].sort());
		});
	});
});
