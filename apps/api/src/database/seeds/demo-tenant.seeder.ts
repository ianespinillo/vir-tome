// src/database/seeds/demo-tenant.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanBorrowerType, LoanStatus, ROLES } from '@repo/common';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { CategoryEntity } from '../../book/entities/category.entity';
import { PublisherEntity } from '../../book/entities/publisher.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { TenantsService } from '../../tenants/tenants.service';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserTenantEntity } from '../../users/entities/user-tenant.entity';
import { UserEntity } from '../../users/entities/user.entity';

// Constantes globales para usuarios protegidos
const SUPER_ADMIN_EMAIL = 'espinilloian@hotmail.com';
const PROTECTED_GLOBAL_USERS = [SUPER_ADMIN_EMAIL];

const DEMO_USERS = [
	{
		email: 'admin@demo.com',
		name: 'María',
		surname: 'González',
		role: ROLES.ADMIN,
		password: 'demo1234',
	},
	{
		email: 'bibliotecario@demo.com',
		name: 'Carlos',
		surname: 'Ruiz',
		role: ROLES.LIBRARIAN,
		password: 'demo1234',
	},
	{
		email: 'profesora@demo.com',
		name: 'Ana',
		surname: 'Martínez',
		role: ROLES.TEACHER,
		password: 'demo1234',
	},
	{
		email: 'estudiante1@demo.com',
		name: 'Lucas',
		surname: 'Pérez',
		role: ROLES.STUDENT,
		password: 'demo1234',
	},
	{
		email: 'estudiante2@demo.com',
		name: 'Sofía',
		surname: 'López',
		role: ROLES.STUDENT,
		password: 'demo1234',
	},
];

@Injectable()
export class DemoSeeder {
	constructor(
		@InjectRepository(TenantEntity)
		private readonly tenantRepository: Repository<TenantEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(RoleEntity)
		private readonly roleRepository: Repository<RoleEntity>,
		@InjectRepository(BookEntity)
		private readonly bookRepository: Repository<BookEntity>,
		@InjectRepository(CategoryEntity)
		private readonly categoryRepository: Repository<CategoryEntity>,
		@InjectRepository(PublisherEntity)
		private readonly publisherRepository: Repository<PublisherEntity>,
		@InjectRepository(LoanEntity)
		private readonly loanRepository: Repository<LoanEntity>,
		@InjectRepository(UserTenantEntity)
		private readonly userTenantRepository: Repository<UserTenantEntity>,
	) {}

	async seed(): Promise<void> {
		console.log('🌱 Starting demo seed...');

		// 1. Crear o encontrar tenant demo
		const demoTenant = await this.createDemoTenant();
		console.log(`✅ Demo tenant: ${demoTenant.name} (ID: ${demoTenant.id})`);

		// 2. Crear roles
		const roles = await this.createRoles(demoTenant.id);
		console.log(`✅ Created ${roles.length} roles`);

		// 3. Crear usuarios
		const users = await this.createUsers(demoTenant.id, roles);
		console.log(`✅ Created ${users.length} users`);

		// 4. Crear Super Admin si no existe (solo una vez)
		await this.createSuperAdmin();
		console.log('✅ Super admin ensured');
		// 4. Crear categorías
		const categories = await this.createCategories();
		console.log(`✅ Created ${categories.length} categories`);

		// 5. Crear editoriales
		const publishers = await this.createPublishers(demoTenant.id);
		console.log(`✅ Created ${publishers.length} publishers`);

		// 6. Crear libros
		const books = await this.createBooks(demoTenant.id, categories, publishers);
		console.log(`✅ Created ${books.length} books`);

		// 7. Crear préstamos
		const loans = await this.createLoans(users, books);
		console.log(`✅ Created ${loans.length} loans`);

		console.log('🎉 Demo seed completed!');
	}

	async reset(): Promise<void> {
		console.log('🧹 Resetting demo data...');

		try {
			const demoTenant = await this.tenantRepository.findOne({
				where: {
					subdomain: 'demo',
				},
			});
			if (!demoTenant) {
				console.log('❌ Demo tenant not found');
				return;
			}
			const tenantId = demoTenant.id;

			// 1. Resetear préstamos SOLO del demo tenant
			await this.resetDemoLoans(tenantId);

			// 2. Resetear datos del demo tenant
			await this.resetDemoTenantData(tenantId);

			// 3. Asegurar usuarios demo (híbrido: mantener si existen)
			await this.seed(); // Reutilizar seed que ya tiene lógica híbrida

			console.log('🧹 Demo data reset completed');
		} catch (error) {
			console.error('❌ Demo reset failed:', error);
			// Don't re-throw - handle gracefully when tenant not found
		}
	}

	private async resetDemoLoans(tenantId: number): Promise<void> {
		await this.loanRepository.query(
			`
			DELETE FROM loan
			USING book
			WHERE loan.book_id = book.id
			AND loan.deleted_at IS NULL
			AND book.tenant_id = $1
			`,
			[tenantId],
		);
	}

	private async resetDemoTenantData(tenantId: number): Promise<void> {
		// Resetear en orden inverso por foreign keys

		// 1. Libros del demo tenant
		await this.bookRepository.delete({ tenant_id: tenantId });

		// 2. Categorías y Publishers (globales, se recrean)
		await this.categoryRepository.delete({});
		await this.publisherRepository.delete({});

		// 3. UserTenant relationships SOLO del demo tenant
		await this.userTenantRepository.delete({ tenant_id: tenantId });

		// NOTA: NO borrar usuarios globales protegidos
	}

	private async createDemoTenant(): Promise<TenantEntity> {
		try {
			// Intentar usar el service (throws si no existe)
			const demoTenant = await this.tenantRepository.findOne({
				where: {
					subdomain: 'demo',
				},
			});
			if (!demoTenant) {
				throw new Error('Demo tenant not found');
			}
			return demoTenant;
		} catch (error) {
			// Si no existe, crearlo
			const demoTenant = this.tenantRepository.create({
				subdomain: 'demo',
				name: 'Escuela Primaria Demo',
				contact_email: 'demo@escuela.com',
				is_active: true,
				is_demo: true,
				plan: 'premium',
				settings: {
					theme: 'blue',
					features: ['basic_library', 'advanced_reports', 'loan_management'],
					school_info: {
						name: 'Escuela Primaria Nuestra Señora del Demo',
						address: 'Av. Educación 123, Ciudad Demo, CP 1234',
						phone: '+54 11 1234-5678',
						principal: 'Prof. María González',
						logo_url: '/assets/demo-school-logo.png',
					},
					limits: {
						max_books: 1000,
						max_users: 200,
						max_loans: 500,
					},
				},
			});
			const saved = await this.tenantRepository.save(demoTenant);
			if (!saved) {
				throw new Error('Failed to create demo tenant');
			}
			return saved;
		}
	}
	private async createSuperAdmin() {
		const superAdminRole = await this.roleRepository.findOne({
			where: { name: ROLES.SUPER_ADMIN },
		});

		const existingSuperAdmin = await this.userRepository.findOne({
			where: { email: SUPER_ADMIN_EMAIL },
		});

		if (!existingSuperAdmin && superAdminRole) {
			await this.userRepository.save({
				email: SUPER_ADMIN_EMAIL,
				name: 'Ian',
				surname: 'Espíndola',
				password: await bcrypt.hash('superadmin123', 10),
				// SIN tenant_id (global)
			});
		}
	}
	private async createRoles(tenantId: number): Promise<RoleEntity[]> {
		const rolesData = [
			{ name: ROLES.ADMIN, description: 'Control total del sistema' },
			{ name: ROLES.LIBRARIAN, description: 'Gestión de libros y préstamos' },
			{ name: ROLES.TEACHER, description: 'Consulta y solicitud de préstamos' },
			{ name: ROLES.STUDENT, description: 'Solo consulta del catálogo' },
			{ name: ROLES.SUPER_ADMIN, description: 'Super admin' },
		];

		const roles: RoleEntity[] = [];
		for (const roleData of rolesData) {
			let role = await this.roleRepository.findOne({
				where: {
					name: roleData.name,
				},
			});

			if (!role) {
				role = this.roleRepository.create({
					...roleData,
				});
				role = await this.roleRepository.save(role);
			}
			roles.push(role);
		}

		return roles;
	}

	private async createUsers(
		tenantId: number,
		roles: RoleEntity[],
	): Promise<UserEntity[]> {
		const users: UserEntity[] = [];

		for (const userData of DEMO_USERS) {
			// Buscar usuario existente (global)
			let user = await this.userRepository.findOne({
				where: { email: userData.email },
				relations: ['userTenants'],
			});

			if (!user) {
				// Crear nuevo usuario global
				user = this.userRepository.create({
					email: userData.email,
					name: userData.name,
					surname: userData.surname,
					password: await bcrypt.hash(userData.password, 10),
				});
				user = await this.userRepository.save(user);
			}

			// Asegurar relación con demo tenant
			const existingRelation = user.userTenants?.find(
				(ut) => ut.tenant_id === tenantId,
			);

			if (!existingRelation) {
				const role = roles.find((r) => r.name === userData.role);
				if (role) {
					await this.userTenantRepository.save({
						user_id: user.id,
						tenant_id: tenantId,
						role_id: role.id,
						is_active: true,
					});
				}
			}

			users.push(user);
		}

		return users;
	}

	private async createCategories(): Promise<CategoryEntity[]> {
		const categoryNames = [
			'Literatura Infantil',
			'Ciencias Naturales',
			'Historia',
			'Matemáticas',
			'Idiomas',
			'Arte y Cultura',
			'Deportes',
			'Cuentos Clásicos',
			'Enciclopedias',
			'Manuales',
		];

		const categories: CategoryEntity[] = [];
		for (const name of categoryNames) {
			let category = await this.categoryRepository.findOne({
				where: { name, deleted_at: IsNull() },
			});

			if (!category) {
				category = this.categoryRepository.create({
					name,
				});
				category = await this.categoryRepository.save(category);
			}
			categories.push(category);
		}
		return categories;
	}

	private async createPublishers(tenantId: number): Promise<PublisherEntity[]> {
		const publisherNames = [
			'Editorial Santillana',
			'Kapelusz',
			'Aique',
			'Editorial Estrada',
			'Norma',
			'SM Ediciones',
			'Loqueleo',
			'Editorial Sigmar',
			'Atlántida',
			'Puerto de Palos',
		];

		const publishers: PublisherEntity[] = [];
		for (const name of publisherNames) {
			let publisher = await this.publisherRepository.findOne({
				where: { name, deleted_at: IsNull() },
			});

			if (!publisher) {
				publisher = this.publisherRepository.create({
					name,
				});
				publisher = await this.publisherRepository.save(publisher);
			}
			publishers.push(publisher);
		}

		return publishers;
	}

	private async createBooks(
		tenantId: number,
		categories: CategoryEntity[],
		publishers: PublisherEntity[],
	): Promise<BookEntity[]> {
		const booksData = [
			{
				title: 'El Principito',
				publicationYear: 1943,
				availableQuantity: 5,
				category: 'Literatura Infantil',
				publisher: 'Editorial Sigmar',
			},
			{
				title: 'Manuelita la Tortuga',
				publicationYear: 1962,
				availableQuantity: 8,
				category: 'Cuentos Clásicos',
				publisher: 'Atlántida',
			},
			{
				title: 'Matemática 4to Grado',
				publicationYear: 2022,
				availableQuantity: 12,
				category: 'Matemáticas',
				publisher: 'Editorial Santillana',
			},
			{
				title: 'Ciencias Naturales para Niños',
				publicationYear: 2021,
				availableQuantity: 10,
				category: 'Ciencias Naturales',
				publisher: 'Kapelusz',
			},
			{
				title: 'Historia Argentina Ilustrada',
				publicationYear: 2020,
				availableQuantity: 6,
				category: 'Historia',
				publisher: 'Aique',
			},
			{
				title: 'English for Kids - Level 1',
				publicationYear: 2023,
				availableQuantity: 15,
				category: 'Idiomas',
				publisher: 'SM Ediciones',
			},
			{
				title: 'Atlas Mundial Infantil',
				publicationYear: 2019,
				availableQuantity: 4,
				category: 'Enciclopedias',
				publisher: 'Editorial Estrada',
			},
			{
				title: 'Cuentos de la Selva',
				publicationYear: 1918,
				availableQuantity: 7,
				category: 'Literatura Infantil',
				publisher: 'Loqueleo',
			},
			{
				title: 'Educación Física y Deportes',
				publicationYear: 2021,
				availableQuantity: 9,
				category: 'Deportes',
				publisher: 'Norma',
			},
			{
				title: 'Arte para Pequeños Artistas',
				publicationYear: 2022,
				availableQuantity: 11,
				category: 'Arte y Cultura',
				publisher: 'Puerto de Palos',
			},
		];

		const books: BookEntity[] = [];
		for (const bookData of booksData) {
			let book = await this.bookRepository.findOne({
				where: {
					title: bookData.title,
					tenant_id: tenantId,
					deleted_at: IsNull(),
				},
			});

			if (!book) {
				const category = categories.find((c) => c?.name === bookData.category);
				const publisher = publishers.find((p) => p.name === bookData.publisher);

				book = this.bookRepository.create({
					title: bookData.title,
					publicationYear: bookData.publicationYear,
					availableQuantity: bookData.availableQuantity,
					tenant_id: tenantId,
					publisher: publisher,
					categories: category ? [category] : [],
				});
				book = await this.bookRepository.save(book);
			}
			books.push(book);
		}

		return books;
	}

	private async createLoans(
		users: UserEntity[],
		books: BookEntity[],
	): Promise<LoanEntity[]> {
		const loansData = [
			{
				userEmail: 'estudiante1@demo.com',
				bookTitle: 'El Principito',
				quantity: 1,
				loan_date: new Date('2024-01-15'),
				return_date: new Date('2024-01-29'),
				status: LoanStatus.RETURNED,
			},
			{
				userEmail: 'estudiante2@demo.com',
				bookTitle: 'Manuelita la Tortuga',
				quantity: 1,
				loan_date: new Date('2024-01-20'),
				return_date: undefined,
				status: LoanStatus.ACTIVE,
			},
			{
				userEmail: 'profesora@demo.com',
				bookTitle: 'Matemática 4to Grado',
				quantity: 2,
				loan_date: new Date('2024-01-25'),
				return_date: undefined,
				status: LoanStatus.ACTIVE,
			},
			{
				userEmail: 'bibliotecario@demo.com',
				bookTitle: 'Historia Argentina Ilustrada',
				quantity: 1,
				loan_date: new Date('2024-01-10'),
				return_date: new Date('2024-01-12'),
				status: LoanStatus.RETURNED,
			},
			{
				userEmail: 'estudiante1@demo.com',
				bookTitle: 'English for Kids - Level 1',
				quantity: 1,
				loan_date: new Date('2024-01-01'),
				return_date: undefined,
				status: LoanStatus.OVERDUE,
			},
		];

		const loans: LoanEntity[] = [];
		for (const loanData of loansData) {
			const user = users.find((u) => u.email === loanData.userEmail);
			const book = books.find((b) => b.title === loanData.bookTitle);

			if (!user || !book) {
				console.warn('Skipping loan: user or book not found');
				continue;
			}

			const existingLoan = await this.loanRepository.findOne({
				where: {
					user_id: user.id,
					book_id: book.id,
					loan_date: loanData.loan_date,
				},
			});

			if (!existingLoan) {
				const loan = this.loanRepository.create({
					borrower_type: LoanBorrowerType.REGISTERED_USER,
					user_id: user.id,
					book_id: book.id,
					quantity: loanData.quantity,
					loan_date: loanData.loan_date,
					return_date: loanData.return_date,
					status: loanData.status,
				});
				const savedLoan = await this.loanRepository.save(loan);
				loans.push(savedLoan);
			}
		}

		return loans;
	}
}
