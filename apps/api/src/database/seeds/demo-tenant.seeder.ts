// src/database/seeds/demo-tenant.seeder.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanStatus, ROLES } from '@repo/common';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { CategoryEntity } from '../../book/entities/category.entity';
import { PublisherEntity } from '../../book/entities/publisher.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserEntity } from '../../users/entities/user.entity';

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

		await this.createSuperAdmin();
		console.log('✅ Created super admin');
		// 4. Crear categorías
		const categories = await this.createCategories(demoTenant.id);
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

		const demoTenant = await this.tenantRepository.findOne({
			where: { subdomain: 'demo', deleted_at: IsNull() },
		});

		if (!demoTenant) {
			console.log('❌ Demo tenant not found');
			return;
		}

		const tenantId = demoTenant.id;

		// Eliminar en orden inverso por las foreign keys
		await this.loanRepository.delete({ deleted_at: IsNull() });
		await this.bookRepository.delete({ tenant_id: tenantId });
		await this.categoryRepository.delete({ tenant_id: tenantId });
		await this.publisherRepository.delete({ tenant_id: tenantId });
		await this.userRepository.delete({ userTenants: { tenant_id: tenantId } });
		await this.roleRepository.delete({});

		console.log('🧹 Demo data reset completed');

		// Re-seed
		await this.seed();
	}

	private async createDemoTenant(): Promise<TenantEntity> {
		let demoTenant = await this.tenantRepository.findOne({
			where: { subdomain: 'demo', deleted_at: IsNull() },
		});

		if (!demoTenant) {
			demoTenant = this.tenantRepository.create({
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
			demoTenant = await this.tenantRepository.save(demoTenant);
		}

		return demoTenant;
	}
	private async createSuperAdmin() {
		const superAdminRole = await this.roleRepository.findOne({
			where: { name: ROLES.SUPER_ADMIN },
		});

		const existingSuperAdmin = await this.userRepository.findOne({
			where: { email: 'superadmin@sistema.com' },
		});

		if (!existingSuperAdmin && superAdminRole) {
			await this.userRepository.save({
				email: 'superadmin@sistema.com',
				name: 'Super',
				surname: 'Admin',
				password: await bcrypt.hash('superadmin123', 10),
				tenant_id: undefined, // Sin tenant específico, o tenant 0
				role_id: superAdminRole.id,
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
		const saltRounds = 10;
		const defaultPassword = await bcrypt.hash('demo123', saltRounds);

		const usersData = [
			{
				name: 'María',
				surname: 'González',
				email: 'admin@demo.com',
				role: ROLES.ADMIN,
			},
			{
				name: 'Carlos',
				surname: 'Ruiz',
				email: 'bibliotecario@demo.com',
				role: ROLES.LIBRARIAN,
			},
			{
				name: 'Ana',
				surname: 'Martínez',
				email: 'profesora@demo.com',
				role: ROLES.TEACHER,
			},
			{
				name: 'Lucas',
				surname: 'Pérez',
				email: 'estudiante1@demo.com',
				role: ROLES.STUDENT,
			},
			{
				name: 'Sofía',
				surname: 'López',
				email: 'estudiante2@demo.com',
				role: ROLES.STUDENT,
			},
		];

		const users: UserEntity[] = [];
		for (const userData of usersData) {
			let user = await this.userRepository.findOne({
				where: {
					email: userData.email,
					userTenants: { tenant_id: tenantId },
					deleted_at: IsNull(),
				},
			});

			if (!user) {
				const role = roles.find((r) => r.name === userData.role);
				if (!role) {
					console.warn(
						`Role ${userData.role} not found, skipping user ${userData.email}`,
					);
					continue;
				}
				user = this.userRepository.create({
					name: userData.name,
					surname: userData.surname,
					email: userData.email,
					password: defaultPassword,
					userTenants: [
						{
							tenant_id: tenantId,
							role_id: role.id,
						},
					],
				});

				await this.userRepository.save(user);
			}
			users.push(user);
		}

		return users;
	}

	private async createCategories(tenantId: number): Promise<CategoryEntity[]> {
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
				where: { name, tenant_id: tenantId, deleted_at: IsNull() },
			});

			if (!category) {
				category = this.categoryRepository.create({
					name,
					tenant_id: tenantId,
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
				where: { name, tenant_id: tenantId, deleted_at: IsNull() },
			});

			if (!publisher) {
				publisher = this.publisherRepository.create({
					name,
					tenant_id: tenantId,
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
