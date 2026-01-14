import { getTestDatabaseConfig } from '@/__tests__/database-test.config';

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateBookDto } from '@repo/common'; // Asumo que esto viene de tu monorepo/librería
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { BookEntity } from '../entities/book.entity';
import { CategoryEntity } from '../entities/category.entity';
import { PublisherEntity } from '../entities/publisher.entity';
import { BookService } from '../services/book.service';
import { CategoryService } from '../services/category.service';
import { PublisherService } from '../services/publisher.service';
describe('Books Multi-tenant Integration (with Testcontainers)', () => {
	// Variables de entorno de prueba
	let container: StartedPostgreSqlContainer;
	let app: TestingModule;
	let dataSource: DataSource;

	// Servicios
	let bookService: BookService;
	let categoryService: CategoryService;
	let publisherService: PublisherService;

	// Datos de prueba (Tenants)
	let tenant1: TenantEntity;
	let tenant2: TenantEntity;

	// Aumentamos el timeout a 60s porque levantar el contenedor puede tardar un poco
	jest.setTimeout(300000);

	beforeAll(async () => {
		// 1. Iniciar el contenedor de PostgreSQL
		const dbConfig = await getTestDatabaseConfig();
		// 2. Crear el módulo de testing con la configuración dinámica del contenedor
		app = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(dbConfig),
				TypeOrmModule.forFeature([
					TenantEntity,
					BookEntity,
					CategoryEntity,
					PublisherEntity,
				]),
			],
			providers: [BookService, CategoryService, PublisherService],
		}).compile();

		// 3. Inicializar servicios y repositorio
		dataSource = app.get<DataSource>(DataSource);
		bookService = app.get<BookService>(BookService);
		categoryService = app.get<CategoryService>(CategoryService);
		publisherService = app.get<PublisherService>(PublisherService);

		const tenantRepository = dataSource.getRepository(TenantEntity);

		// 4. Crear tenants base (estos se mantienen durante toda la suite)
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
		// Cerrar conexión y apagar contenedor
		if (app) await app.close();
	});

	beforeEach(async () => {
		// Limpiar datos entre tests PERO mantener los tenants
		// El orden es importante para evitar errores de Foreign Keys
		const bookRepo = dataSource.getRepository(BookEntity);
		const categoryRepo = dataSource.getRepository(CategoryEntity);
		const publisherRepo = dataSource.getRepository(PublisherEntity);

		await bookRepo.delete({}); // Primero los hijos
		await categoryRepo.delete({});
		await publisherRepo.delete({}); // Al final los padres (excepto tenants)
	});

	describe('Book Isolation', () => {
		let publisher1: PublisherEntity;
		let publisher2: PublisherEntity;
		let category1: CategoryEntity;
		let category2: CategoryEntity;

		beforeEach(async () => {
			publisher1 = await publisherService.create({
				name: 'Publisher T1',
			});
			publisher2 = await publisherService.create({
				name: 'Publisher T2',
			});
			category1 = await categoryService.create({
				name: 'Category T1',
			});
			category2 = await categoryService.create({
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
				title: 'Matemática 4to',
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

			const foundByOwner = await bookService.findById(tenant1.id, book.id);
			expect(foundByOwner).toBeTruthy();

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

			await bookService.removeStock(tenant1.id, book1.id, 3);

			const updatedBook1 = await bookService.findById(tenant1.id, book1.id);
			const updatedBook2 = await bookService.findById(tenant2.id, book2.id);

			expect(updatedBook1?.availableQuantity).toBe(7);
			expect(updatedBook2?.availableQuantity).toBe(5);
		});

		test('should paginate books with tenant isolation', async () => {
			// Setup más rápido usando Promise.all para ahorrar tiempo en integration test
			const booksT1 = Array.from({ length: 10 }, (_, i) => ({
				title: `Book T1 ${i + 1}`,
				publicationYear: 2023,
				availableQuantity: i + 1,
				publisherId: publisher1.id,
				categoryIds: [category1.id],
			}));

			// Creamos en paralelo (opcional, pero optimiza)
			await Promise.all(booksT1.map((b) => bookService.createBook(tenant1.id, b)));

			const booksT2 = Array.from({ length: 3 }, (_, i) => ({
				title: `Book T2 ${i + 1}`,
				publicationYear: 2023,
				availableQuantity: i + 1,
				publisherId: publisher2.id,
				categoryIds: [category2.id],
			}));
			await Promise.all(booksT2.map((b) => bookService.createBook(tenant2.id, b)));

			const tenant1Page1 = await bookService.findAllWithDetailsPaginated(
				tenant1.id,
				1,
			);
			const tenant2Page1 = await bookService.findAllWithDetailsPaginated(
				tenant2.id,
				1,
			);

			expect(tenant1Page1.items).toHaveLength(6);
			expect(tenant1Page1.meta.total).toBe(10);
			expect(tenant1Page1.meta.last_page).toBe(2);

			expect(tenant2Page1.items).toHaveLength(3);
			expect(tenant2Page1.meta.total).toBe(3);
			expect(tenant2Page1.meta.last_page).toBe(1);
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

			const updated = await bookService.updateBook(tenant1.id, book.id, {
				id: book.id,
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
			const publisher = await publisherService.create({
				name: 'Test Publisher',
			});

			const cat1 = await categoryService.create({ name: 'Cat 1' });
			const cat2 = await categoryService.create({ name: 'Cat 2' });

			const book = await bookService.createBook(tenant1.id, {
				title: 'Complex Book',
				publicationYear: 2023,
				availableQuantity: 5,
				publisherId: publisher.id,
				categoryIds: [cat1.id, cat2.id],
			});

			const foundBook = await bookService.findOneBook(tenant1.id, book.id);

			expect(foundBook.publisher.id).toBe(publisher.id);
			expect(foundBook.categories).toHaveLength(2);
			expect(foundBook.categories.sort()).toEqual([cat1, cat2].sort());
		});
	});
});
