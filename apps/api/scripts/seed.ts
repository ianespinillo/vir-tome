// Importa tus enums reales de @repo/common
import { LoanStatus, ROLES } from '@repo/common';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { BookEntity } from '../src/book/entities/book.entity';
import { CategoryEntity } from '../src/book/entities/category.entity';
import { PublisherEntity } from '../src/book/entities/publisher.entity';
import { LoanEntity } from '../src/loan/entities/loan.entity';
import { TenantEntity } from '../src/tenants/entities/tenant.entity';
import { TokenEntity } from '../src/tokens/entities/tokens.entity';
import { RoleEntity } from '../src/users/entities/role.entity';
import { UserTenantEntity } from '../src/users/entities/user-tenant.entity';
// IMPORTA TUS ENTIDADES AQUI
import { UserEntity } from '../src/users/entities/user.entity';
config();

// Configura esto igual que tu app.module.ts
const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	entities: [
		UserEntity,
		TenantEntity,
		UserTenantEntity,
		RoleEntity,
		BookEntity,
		CategoryEntity,
		PublisherEntity,
		LoanEntity,
		TokenEntity,
	],
	synchronize: true, // ¡Cuidado! Solo para dev
});

async function seed() {
	// Importa faker aquí para evitar problemas de carga
	const { faker } = await import('@faker-js/faker');
	console.log('🌱 Conectando a la Base de Datos...');
	await AppDataSource.initialize();

	// 1. LIMPIEZA TOTAL (Orden inverso para respetar Foreign Keys)
	console.log('🧹 Limpiando datos viejos...');
	await AppDataSource.query(`TRUNCATE TABLE "loan" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "user_tenants" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "book_categories" CASCADE`); // Tabla pivote
	await AppDataSource.query(`TRUNCATE TABLE "book" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "category" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "publisher" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "roles" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "tenant" CASCADE`);
	await AppDataSource.query(`TRUNCATE TABLE "users" CASCADE`);

	// 2. SETTINGS
	faker.seed(123); // ¡Importante! Hace que los datos sean siempre iguales

	// ==========================================
	// CREAR TENANTS
	// ==========================================
	console.log('🏢 Creando Tenants...');
	const tenantRepo = AppDataSource.getRepository(TenantEntity);

	const demoTenant = await tenantRepo.save({
		name: 'Biblioteca Central (Demo)',
		subdomain: 'demo',
		contact_email: 'admin@demo.com',
		is_active: true,
		is_demo: true,
		plan: 'enterprise',
		settings: { theme: 'blue', limits: { max_books: 1000 } },
	});

	const emptyTenant = await tenantRepo.save({
		name: 'Biblioteca Vecinal (Vacía)',
		subdomain: 'vecina',
		contact_email: 'admin@vecina.com',
		is_active: true,
		plan: 'basic',
		settings: { theme: 'green', limits: { max_books: 50 } },
	});

	// ==========================================
	// CREAR ROLES (Por Tenant)
	// ==========================================
	console.log('👮 Creando Roles...');
	const roleRepo = AppDataSource.getRepository(RoleEntity);

	// Roles para Demo
	const adminRole = await roleRepo.save({
		name: ROLES.ADMIN,
		tenant_id: demoTenant.id,
		description: 'Jefe total',
	});
	const libRole = await roleRepo.save({
		name: ROLES.LIBRARIAN,
		tenant_id: demoTenant.id,
		description: 'Bibliotecario',
	});
	const studentRole = await roleRepo.save({
		name: ROLES.STUDENT,
		tenant_id: demoTenant.id,
		description: 'Estudiante',
	});

	// Roles para Vecina
	const adminRoleVecina = await roleRepo.save({
		name: ROLES.ADMIN,
		tenant_id: emptyTenant.id,
	});

	// ==========================================
	// CREAR USUARIOS
	// ==========================================
	console.log('👥 Creando Usuarios...');
	const userRepo = AppDataSource.getRepository(UserEntity);
	const userTenantRepo = AppDataSource.getRepository(UserTenantEntity);

	// Password hash mock (en realidad deberías usar bcrypt aquí si tu entidad no lo hace automáticamente)
	const mockPass = '123456';

	// Usuario 1: Admin del Tenant Demo
	const uAdmin = await userRepo.save({
		email: 'admin@demo.com',
		name: 'Admin',
		surname: 'User',
		password: mockPass,
	});
	await userTenantRepo.save({
		user: uAdmin,
		tenant: demoTenant,
		role: adminRole,
		is_active: true,
	});

	// Usuario 2: Estudiante en Demo
	const uStudent = await userRepo.save({
		email: 'student@demo.com',
		name: 'Pepe',
		surname: 'Estudiante',
		password: mockPass,
	});
	await userTenantRepo.save({
		user: uStudent,
		tenant: demoTenant,
		role: studentRole,
		is_active: true,
	});

	// Usuario 3: EL VIAJERO (Está en ambos tenants)
	// Este es clave para probar tu frontend al cambiar de subdomain
	const uTraveler = await userRepo.save({
		email: 'multi@demo.com',
		name: 'Viajero',
		surname: 'Multitenant',
		password: mockPass,
	});
	// Es Librarian en Demo
	await userTenantRepo.save({
		user: uTraveler,
		tenant: demoTenant,
		role: libRole,
		is_active: true,
	});
	// Es Admin en Vecina
	await userTenantRepo.save({
		user: uTraveler,
		tenant: emptyTenant,
		role: adminRoleVecina,
		is_active: true,
	});

	// ==========================================
	// CREAR DATOS DEL DOMINIO (Solo para Demo Tenant)
	// ==========================================
	console.log('📚 Poblando Biblioteca Demo...');

	const publisherRepo = AppDataSource.getRepository(PublisherEntity);
	const categoryRepo = AppDataSource.getRepository(CategoryEntity);
	const bookRepo = AppDataSource.getRepository(BookEntity);
	const loanRepo = AppDataSource.getRepository(LoanEntity);

	// 1. Editoriales
	const publishers: PublisherEntity[] = [];
	for (let i = 0; i < 5; i++) {
		publishers.push(
			await publisherRepo.save({
				name: faker.company.name(),
				tenant_id: demoTenant.id, // Asumiendo que MultiTenantEntity tiene esta col
			}),
		);
	}

	// 2. Categorías
	const categories: CategoryEntity[] = [];
	const catNames = ['Ficción', 'Ciencia', 'Historia', 'Tecnología', 'Arte'];
	for (const name of catNames) {
		categories.push(
			await categoryRepo.save({
				name: name,
				tenant_id: demoTenant.id,
			}),
		);
	}

	// 3. Libros (Creamos 50)
	const books: BookEntity[] = [];
	for (let i = 0; i < 50; i++) {
		const book = await bookRepo.save({
			title: faker.lorem.words(3),
			publicationYear: faker.date.past({ years: 20 }).getFullYear(),
			availableQuantity: faker.number.int({ min: 1, max: 10 }),
			publisher: faker.helpers.arrayElement(publishers),
			categories: faker.helpers.arrayElements(categories, { min: 1, max: 2 }),
			tenant_id: demoTenant.id, // Asignación explícita
		});
		books.push(book);
	}

	// 4. Préstamos (Loans)
	console.log('🔄 Generando préstamos...');

	// Préstamos Activos
	await loanRepo.save({
		user: uStudent,
		user_id: uStudent.id,
		book: books[0],
		quantity: 1,
		loan_date: new Date(),
		status: LoanStatus.ACTIVE,
	});

	// Préstamos Vencidos (Para probar alertas UI color rojo)
	await loanRepo.save({
		user: uStudent,
		user_id: uStudent.id,
		book: books[1],
		quantity: 1,
		loan_date: faker.date.past(), // Fecha vieja
		return_date: faker.date.past(), // Fecha devolución vieja
		status: LoanStatus.OVERDUE,
	});

	console.log('✅ Seeding Completado Exitosamente');
	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ Error en seeding:', err);
	process.exit(1);
});
