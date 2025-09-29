// src/__tests__/tenant-isolation.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { testDatabaseConfig } from '../../__tests__/database-test.config';
import { getTestDataSource } from '../../__tests__/setup';
import { BookEntity } from '../../book/entities/book.entity';
import { MultiTenantService } from '../../core/multi-tenat.service';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';

// Test service para probar el MultiTenantService
class TestBookService extends MultiTenantService<BookEntity> {
	async findAvailable(tenantId: number) {
		return this.findBy(tenantId, {
			availableQuantity: MoreThan(0),
		});
	}
}

describe('Multi-tenant Data Isolation', () => {
	let app: TestingModule;
	let dataSource: DataSource;
	let bookService: TestBookService;
	let tenantRepository: Repository<TenantEntity>;
	let userRepository: Repository<UserEntity>;
	let roleRepository: Repository<RoleEntity>;

	let tenant1: TenantEntity;
	let tenant2: TenantEntity;
	let tenant3: TenantEntity;

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				TypeOrmModule.forRoot(testDatabaseConfig),
				TypeOrmModule.forFeature([
					TenantEntity,
					BookEntity,
					UserEntity,
					RoleEntity,
				]),
			],
			providers: [TestBookService],
		}).compile();

		dataSource = getTestDataSource();
		tenantRepository = app.get('TenantEntityRepository');
		userRepository = app.get('UserEntityRepository');
		roleRepository = app.get('RoleEntityRepository');

		const bookRepository = app.get('BookEntityRepository');
		bookService = new TestBookService(bookRepository);

		// Crear tenants de prueba
		tenant1 = await tenantRepository.save({
			subdomain: 'school-alpha',
			name: 'Alpha School',
			contact_email: 'admin@alpha.edu',
			is_active: true,
			is_demo: false,
		});

		tenant2 = await tenantRepository.save({
			subdomain: 'school-beta',
			name: 'Beta School',
			contact_email: 'admin@beta.edu',
			is_active: true,
			is_demo: false,
		});

		tenant3 = await tenantRepository.save({
			subdomain: 'school-gamma',
			name: 'Gamma School',
			contact_email: 'admin@gamma.edu',
			is_active: true,
			is_demo: false,
		});
	});

	afterAll(async () => {
		await dataSource.destroy();
		await app.close();
		// Limpiar TODOS los datos, incluyendo tenants
	});

	beforeEach(async () => {
		// Limpiar datos entre tests
		await dataSource.getRepository(BookEntity).delete({});
		await dataSource.getRepository(UserEntity).delete({});
		await dataSource.getRepository(RoleEntity).delete({});
	});

	describe('CRUD Operations Isolation', () => {
		test('CREATE: should isolate book creation by tenant', async () => {
			// Crear libros para diferentes tenants
			const book1 = await bookService.create(tenant1.id, {
				title: 'Mathematics Grade 4',
				publicationYear: 2023,
				availableQuantity: 10,
			});

			const book2 = await bookService.create(tenant2.id, {
				title: 'Mathematics Grade 4', // Mismo título
				publicationYear: 2023,
				availableQuantity: 5,
			});

			// Verificar que cada tenant ve solo sus libros
			const tenant1Books = await bookService.findAll(tenant1.id);
			const tenant2Books = await bookService.findAll(tenant2.id);
			const tenant3Books = await bookService.findAll(tenant3.id);

			expect(tenant1Books).toHaveLength(1);
			expect(tenant1Books[0].availableQuantity).toBe(10);
			expect(tenant1Books[0].tenant_id).toBe(tenant1.id);

			expect(tenant2Books).toHaveLength(1);
			expect(tenant2Books[0].availableQuantity).toBe(5);
			expect(tenant2Books[0].tenant_id).toBe(tenant2.id);

			expect(tenant3Books).toHaveLength(0);
		});

		test('READ: should not access books from other tenants', async () => {
			// Crear libro para tenant1
			const book = await bookService.create(tenant1.id, {
				title: 'Secret Book',
				publicationYear: 2023,
				availableQuantity: 1,
			});

			// Tenant1 debe poder accederlo
			const foundByOwner = await bookService.findById(tenant1.id, book.id);
			expect(foundByOwner).toBeTruthy();
			expect(foundByOwner?.title).toBe('Secret Book');

			// Otros tenants NO deben poder accederlo
			const foundByTenant2 = await bookService.findById(tenant2.id, book.id);
			const foundByTenant3 = await bookService.findById(tenant3.id, book.id);

			expect(foundByTenant2).toBeNull();
			expect(foundByTenant3).toBeNull();
		});

		test('UPDATE: should prevent cross-tenant updates', async () => {
			// Crear libro para tenant1
			const book = await bookService.create(tenant1.id, {
				title: 'Editable Book',
				publicationYear: 2023,
				availableQuantity: 3,
			});

			// Tenant1 debe poder actualizar
			const updated = await bookService.update(tenant1.id, book.id, {
				title: 'Updated Book',
				availableQuantity: 5,
			});

			expect(updated.title).toBe('Updated Book');
			expect(updated.availableQuantity).toBe(5);
			expect(updated.tenant_id).toBe(tenant1.id);

			// Tenant2 NO debe poder actualizar
			await expect(
				bookService.update(tenant2.id, book.id, {
					title: 'Hacked Book',
				}),
			).rejects.toThrow();

			// Verificar que el libro no fue modificado por el intento malicioso
			const unchanged = await bookService.findById(tenant1.id, book.id);
			expect(unchanged?.title).toBe('Updated Book');
		});

		test('DELETE: should prevent cross-tenant deletion', async () => {
			// Crear libro para tenant1
			const book = await bookService.create(tenant1.id, {
				title: 'Important Book',
				publicationYear: 2023,
				availableQuantity: 1,
			});

			// Tenant2 NO debe poder eliminar
			await expect(bookService.delete(tenant2.id, book.id)).rejects.toThrow();

			// Verificar que el libro sigue existiendo
			const stillExists = await bookService.findById(tenant1.id, book.id);
			expect(stillExists).toBeTruthy();
			expect(stillExists?.deleted_at).toBeNull();

			// Tenant1 SÍ debe poder eliminar
			await bookService.delete(tenant1.id, book.id);

			const deleted = await bookService.findById(tenant1.id, book.id);
			expect(deleted).toBeNull();
		});
	});

	describe('Complex Query Isolation', () => {
		beforeEach(async () => {
			// Preparar datos de prueba
			const testData = [
				// Tenant 1 - Alpha School
				{
					tenantId: tenant1.id,
					title: 'Math Textbook',
					year: 2023,
					quantity: 10,
				},
				{
					tenantId: tenant1.id,
					title: 'Science Lab Manual',
					year: 2022,
					quantity: 5,
				},
				{
					tenantId: tenant1.id,
					title: 'History Atlas',
					year: 2021,
					quantity: 0,
				},
				{
					tenantId: tenant1.id,
					title: 'English Grammar',
					year: 2023,
					quantity: 8,
				},

				// Tenant 2 - Beta School
				{
					tenantId: tenant2.id,
					title: 'Math Textbook',
					year: 2023,
					quantity: 7,
				},
				{
					tenantId: tenant2.id,
					title: 'Art Handbook',
					year: 2022,
					quantity: 3,
				},
				{
					tenantId: tenant2.id,
					title: 'Music Theory',
					year: 2023,
					quantity: 0,
				},

				// Tenant 3 - Gamma School
				{
					tenantId: tenant3.id,
					title: 'Physical Education Guide',
					year: 2023,
					quantity: 12,
				},
				{
					tenantId: tenant3.id,
					title: 'Computer Science Basics',
					year: 2024,
					quantity: 15,
				},
			];

			for (const data of testData) {
				await bookService.create(data.tenantId, {
					title: data.title,
					publicationYear: data.year,
					availableQuantity: data.quantity,
				});
			}
		});

		test('should isolate search by title across tenants', async () => {
			// Buscar "Math Textbook" en diferentes tenants
			const tenant1Math = await bookService.findBy(tenant1.id, {
				title: 'Math Textbook',
			});
			const tenant2Math = await bookService.findBy(tenant2.id, {
				title: 'Math Textbook',
			});
			const tenant3Math = await bookService.findBy(tenant3.id, {
				title: 'Math Textbook',
			});

			expect(tenant1Math).toHaveLength(1);
			expect(tenant1Math[0].availableQuantity).toBe(10);

			expect(tenant2Math).toHaveLength(1);
			expect(tenant2Math[0].availableQuantity).toBe(7);

			expect(tenant3Math).toHaveLength(0);
		});

		test('should isolate pagination across tenants', async () => {
			// Tenant1 tiene 4 libros
			const tenant1Page1 = await bookService.findByPage(tenant1.id, 1, 2);
			const tenant1Page2 = await bookService.findByPage(tenant1.id, 2, 2);

			expect(tenant1Page1.data).toHaveLength(2);
			expect(tenant1Page1.total).toBe(4);
			expect(tenant1Page1.current_page).toBe(1);
			expect(tenant1Page1.last_page).toBe(2);

			expect(tenant1Page2.data).toHaveLength(2);
			expect(tenant1Page2.current_page).toBe(2);

			// Tenant2 tiene 3 libros
			const tenant2Page1 = await bookService.findByPage(tenant2.id, 1, 2);

			expect(tenant2Page1.data).toHaveLength(2);
			expect(tenant2Page1.total).toBe(3);
			expect(tenant2Page1.last_page).toBe(2);

			// Verificar que no hay cross-contamination
			const allTenant1Ids = [
				...tenant1Page1.data.map((b) => b.tenant_id),
				...tenant1Page2.data.map((b) => b.tenant_id),
			];
			expect(allTenant1Ids.every((id) => id === tenant1.id)).toBe(true);
		});

		test('should isolate count queries', async () => {
			const tenant1Count = await bookService.count(tenant1.id);
			const tenant2Count = await bookService.count(tenant2.id);
			const tenant3Count = await bookService.count(tenant3.id);

			expect(tenant1Count).toBe(4);
			expect(tenant2Count).toBe(3);
			expect(tenant3Count).toBe(2);

			// Contar solo libros disponibles
			const tenant1Available = await bookService.count(tenant1.id, {
				availableQuantity: MoreThan(0),
			});
			const tenant2Available = await bookService.count(tenant2.id, {
				availableQuantity: MoreThan(0),
			});

			expect(tenant1Available).toBe(3); // Excluye History Atlas (quantity: 0)
			expect(tenant2Available).toBe(2); // Excluye Music Theory (quantity: 0)
		});

		test('should isolate search by name patterns', async () => {
			const tenant1SearchBook = await bookService.findByName(
				tenant1.id,
				'book',
				'title',
			);
			const tenant2SearchGuide = await bookService.findByName(
				tenant2.id,
				'Theory',
				'title',
			);
			const tenant3SearchGuide = await bookService.findByName(
				tenant3.id,
				'Guide',
				'title',
			);

			expect(tenant1SearchBook).toHaveLength(1); // Math Textbook
			expect(tenant1SearchBook[0].title).toBe('Math Textbook');

			expect(tenant2SearchGuide).toHaveLength(1); // Music Theory
			expect(tenant2SearchGuide[0].title).toBe('Music Theory');

			expect(tenant3SearchGuide).toHaveLength(1); // Physical Education Guide
			expect(tenant3SearchGuide[0].title).toBe('Physical Education Guide');
		});
	});

	describe('Batch Operations Isolation', () => {
		test('should isolate createMany operations', async () => {
			const booksForTenant1 = [
				{ title: 'Batch Book 1A', publicationYear: 2023, availableQuantity: 1 },
				{ title: 'Batch Book 1B', publicationYear: 2023, availableQuantity: 2 },
			];

			const booksForTenant2 = [
				{ title: 'Batch Book 2A', publicationYear: 2023, availableQuantity: 3 },
				{ title: 'Batch Book 2B', publicationYear: 2023, availableQuantity: 4 },
				{ title: 'Batch Book 2C', publicationYear: 2023, availableQuantity: 5 },
			];

			await bookService.createMany(tenant1.id, booksForTenant1);
			await bookService.createMany(tenant2.id, booksForTenant2);

			const tenant1Results = await bookService.findAll(tenant1.id);
			const tenant2Results = await bookService.findAll(tenant2.id);
			const tenant3Results = await bookService.findAll(tenant3.id);

			expect(tenant1Results).toHaveLength(2);
			expect(tenant2Results).toHaveLength(3);
			expect(tenant3Results).toHaveLength(0);

			// Verificar tenant_id correcto
			expect(tenant1Results.every((book) => book.tenant_id === tenant1.id)).toBe(
				true,
			);
			expect(tenant2Results.every((book) => book.tenant_id === tenant2.id)).toBe(
				true,
			);
		});

		test('should isolate deleteMany operations', async () => {
			// Crear libros para tenant1
			const book1 = await bookService.create(tenant1.id, {
				title: 'Delete Me 1',
				publicationYear: 2023,
				availableQuantity: 1,
			});
			const book2 = await bookService.create(tenant1.id, {
				title: 'Delete Me 2',
				publicationYear: 2023,
				availableQuantity: 1,
			});

			// Crear libro para tenant2
			const book3 = await bookService.create(tenant2.id, {
				title: 'Keep Me Safe',
				publicationYear: 2023,
				availableQuantity: 1,
			});

			// Eliminar libros de tenant1
			await bookService.deleteMany(tenant1.id, [book1.id, book2.id]);

			// Verificar que solo se eliminaron los libros del tenant correcto
			const remainingTenant1 = await bookService.findAll(tenant1.id);
			const remainingTenant2 = await bookService.findAll(tenant2.id);

			expect(remainingTenant1).toHaveLength(0);
			expect(remainingTenant2).toHaveLength(1);
			expect(remainingTenant2[0].title).toBe('Keep Me Safe');

			// Intentar eliminar libro de otro tenant debería fallar
			await expect(
				bookService.deleteMany(tenant1.id, [book3.id]),
			).rejects.toThrow();
		});
	});

	describe('Statistics Isolation', () => {
		beforeEach(async () => {
			// Crear algunos libros con soft delete
			const book1 = await bookService.create(tenant1.id, {
				title: 'Active Book 1',
				publicationYear: 2023,
				availableQuantity: 1,
			});
			await bookService.create(tenant1.id, {
				title: 'Active Book 2',
				publicationYear: 2023,
				availableQuantity: 1,
			});

			// Soft delete uno
			await bookService.delete(tenant1.id, book1.id);

			// Crear libros para tenant2
			await bookService.create(tenant2.id, {
				title: 'Tenant2 Book 1',
				publicationYear: 2023,
				availableQuantity: 1,
			});
			await bookService.create(tenant2.id, {
				title: 'Tenant2 Book 2',
				publicationYear: 2023,
				availableQuantity: 1,
			});
			await bookService.create(tenant2.id, {
				title: 'Tenant2 Book 3',
				publicationYear: 2023,
				availableQuantity: 1,
			});
		});

		test('should provide isolated statistics per tenant', async () => {
			const tenant1Stats = await bookService.getStats(tenant1.id);
			const tenant2Stats = await bookService.getStats(tenant2.id);
			const tenant3Stats = await bookService.getStats(tenant3.id);

			expect(tenant1Stats).toEqual({
				total: 2,
				active: 1,
				deleted: 1,
			});

			expect(tenant2Stats).toEqual({
				total: 3,
				active: 3,
				deleted: 0,
			});

			expect(tenant3Stats).toEqual({
				total: 0,
				active: 0,
				deleted: 0,
			});
		});
	});

	describe('Cross-Entity Isolation', () => {
		test('should isolate users and roles by tenant', async () => {
			// Crear roles con el mismo nombre en diferentes tenants
			const adminRole1 = await roleRepository.save({
				name: 'Administrator',
				tenant_id: tenant1.id,
			});

			const adminRole2 = await roleRepository.save({
				name: 'Administrator',
				tenant_id: tenant2.id,
			});

			// Crear usuarios en diferentes tenants
			const user1 = await userRepository.save({
				name: 'John',
				surname: 'Doe',
				email: 'john@alpha.edu',
				password: 'password123',
				tenant_id: tenant1.id,
				role: { id: 1 },
			});

			const user2 = await userRepository.save({
				name: 'Jane',
				surname: 'Smith',
				email: 'jane@beta.edu',
				password: 'password123',
				tenant_id: tenant2.id,
				role: {
					id: 2,
				},
			});

			// Verificar aislamiento de roles
			const tenant1Roles = await roleRepository.find({
				where: { tenant_id: tenant1.id },
			});
			const tenant2Roles = await roleRepository.find({
				where: { tenant_id: tenant2.id },
			});

			expect(tenant1Roles).toHaveLength(1);
			expect(tenant1Roles[0].id).toBe(adminRole1.id);

			expect(tenant2Roles).toHaveLength(1);
			expect(tenant2Roles[0].id).toBe(adminRole2.id);

			// Verificar aislamiento de usuarios
			const tenant1Users = await userRepository.find({
				where: { tenant_id: tenant1.id },
			});
			const tenant2Users = await userRepository.find({
				where: { tenant_id: tenant2.id },
			});

			expect(tenant1Users).toHaveLength(1);
			expect(tenant1Users[0].email).toBe('john@alpha.edu');

			expect(tenant2Users).toHaveLength(1);
			expect(tenant2Users[0].email).toBe('jane@beta.edu');
		});
	});
});
