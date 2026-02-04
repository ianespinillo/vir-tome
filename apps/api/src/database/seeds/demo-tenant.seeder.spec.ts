// src/database/seeds/demo-tenant.seeder.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral, Repository } from 'typeorm';
import { BookEntity } from '../../book/entities/book.entity';
import { CategoryEntity } from '../../book/entities/category.entity';
import { PublisherEntity } from '../../book/entities/publisher.entity';
import { LoanEntity } from '../../loan/entities/loan.entity';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { RoleEntity } from '../../users/entities/role.entity';
import { UserTenantEntity } from '../../users/entities/user-tenant.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { DemoSeeder } from './demo-tenant.seeder';

jest.mock('bcrypt');

type MockRepo<T extends ObjectLiteral = any> = Partial<
	Record<keyof Repository<T>, jest.Mock>
>;

function createMockRepo<T extends ObjectLiteral = any>(): MockRepo<T> {
	return {
		findOne: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		delete: jest.fn(),
		query: jest.fn(),
		createQueryBuilder: jest.fn(() => ({
			leftJoin: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			andWhere: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			execute: jest.fn().mockResolvedValue(undefined),
		})),
	};
}

describe('DemoSeeder', () => {
	let seeder: DemoSeeder;
	let tenantRepo: MockRepo<TenantEntity>;
	let roleRepo: MockRepo<RoleEntity>;
	let userRepo: MockRepo<UserEntity>;
	let categoryRepo: MockRepo<CategoryEntity>;
	let publisherRepo: MockRepo<PublisherEntity>;
	let bookRepo: MockRepo<BookEntity>;
	let loanRepo: MockRepo<LoanEntity>;
	let userTenantRepo: MockRepo<UserTenantEntity>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DemoSeeder,
				{
					provide: getRepositoryToken(TenantEntity),
					useValue: createMockRepo(),
				},
				{ provide: getRepositoryToken(UserEntity), useValue: createMockRepo() },
				{ provide: getRepositoryToken(RoleEntity), useValue: createMockRepo() },
				{ provide: getRepositoryToken(BookEntity), useValue: createMockRepo() },
				{
					provide: getRepositoryToken(CategoryEntity),
					useValue: createMockRepo(),
				},
				{
					provide: getRepositoryToken(PublisherEntity),
					useValue: createMockRepo(),
				},
				{ provide: getRepositoryToken(LoanEntity), useValue: createMockRepo() },
				{
					provide: getRepositoryToken(UserTenantEntity),
					useValue: createMockRepo(),
				},
			],
		}).compile();

		seeder = module.get(DemoSeeder);
		tenantRepo = module.get<MockRepo<TenantEntity>>(
			getRepositoryToken(TenantEntity),
			{ strict: false },
		);
		roleRepo = module.get<MockRepo<RoleEntity>>(getRepositoryToken(RoleEntity), {
			strict: false,
		});
		userRepo = module.get<MockRepo<UserEntity>>(getRepositoryToken(UserEntity), {
			strict: false,
		});
		categoryRepo = module.get<MockRepo<CategoryEntity>>(
			getRepositoryToken(CategoryEntity),
			{ strict: false },
		);
		publisherRepo = module.get<MockRepo<PublisherEntity>>(
			getRepositoryToken(PublisherEntity),
			{ strict: false },
		);
		bookRepo = module.get<MockRepo<BookEntity>>(getRepositoryToken(BookEntity), {
			strict: false,
		});
		loanRepo = module.get<MockRepo<LoanEntity>>(getRepositoryToken(LoanEntity), {
			strict: false,
		});
		userTenantRepo = module.get<MockRepo<UserTenantEntity>>(
			getRepositoryToken(UserTenantEntity),
			{ strict: false },
		);
	});

	describe('createDemoTenant', () => {
		it('crea un tenant demo si no existe', async () => {
			tenantRepo.findOne?.mockResolvedValue(null);
			tenantRepo.create?.mockReturnValue({ subdomain: 'demo' });
			tenantRepo.save?.mockResolvedValue({ id: 1, subdomain: 'demo' });

			const result = await seeder['createDemoTenant']();

			expect(tenantRepo.findOne).toHaveBeenCalledWith({
				where: {
					subdomain: 'demo',
				},
			});
			expect(tenantRepo.create).toHaveBeenCalled();
			expect(tenantRepo.save).toHaveBeenCalled();
			expect(result).toEqual({ id: 1, subdomain: 'demo' });
		});

		it('retorna tenant existente si ya está creado', async () => {
			const existingTenant = { id: 99, subdomain: 'demo' };
			tenantRepo.findOne?.mockResolvedValue(existingTenant);

			const result = await seeder['createDemoTenant']();

			expect(tenantRepo.findOne).toHaveBeenCalledWith({
				where: {
					subdomain: 'demo',
				},
			});
			expect(tenantRepo.create).not.toHaveBeenCalled();
			expect(result).toBe(existingTenant);
		});
	});

	describe('createRoles', () => {
		it('crea roles faltantes y devuelve lista completa', async () => {
			roleRepo.findOne?.mockImplementation((async) => null);
			roleRepo.create?.mockImplementation((data) => data);
			roleRepo.save?.mockImplementation((data) =>
				Promise.resolve({ id: Date.now(), ...data }),
			);

			const result = await seeder['createRoles'](1);

			expect(roleRepo.findOne).toHaveBeenCalledTimes(5);
			expect(roleRepo.save).toHaveBeenCalledTimes(5);
			expect(result).toHaveLength(5);
		});
	});

	describe('createUsers', () => {
		it('crea usuarios con password hasheado si no existen', async () => {
			const hashedPassword = 'hashed_password_demo1234';
			(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			userRepo.findOne?.mockResolvedValue(null);
			userRepo.create?.mockImplementation((data) => data);
			userRepo.save?.mockImplementation((data) =>
				Promise.resolve({ id: Date.now(), ...data }),
			);
			userTenantRepo.save?.mockResolvedValue(undefined);

			const roles: RoleEntity[] = [{ id: 1, name: ROLES.ADMIN } as RoleEntity];

			const result = await seeder['createUsers'](1, roles);

			expect(userRepo.findOne).toHaveBeenCalled();
			expect(userRepo.save).toHaveBeenCalled();
			expect(userTenantRepo.save).toHaveBeenCalled();
			expect(bcrypt.hash).toHaveBeenCalledWith('demo1234', 10);
			expect(result[0].password).toBe(hashedPassword);
			expect(result[0].password).not.toBe('demo1234');
			expect(await bcrypt.compare('demo1234', result[0].password)).toBe(true);
		});

		it('no recrea usuarios existentes, solo asegura relación tenant', async () => {
			const existingUser = {
				id: 123,
				email: 'admin@demo.com',
				userTenants: [],
			};
			userRepo.findOne?.mockResolvedValue(existingUser);
			userTenantRepo.save?.mockResolvedValue(undefined);

			const roles: RoleEntity[] = [{ id: 1, name: ROLES.ADMIN } as RoleEntity];

			const result = await seeder['createUsers'](1, roles);

			expect(userRepo.save).not.toHaveBeenCalled();
			expect(userTenantRepo.save).toHaveBeenCalled();
			expect(result[0]).toBe(existingUser);
		});
	});

	describe('reset', () => {
		it('resetea datos del demo tenant y re-seedea si existe', async () => {
			const demoTenant = { id: 1, subdomain: 'demo' };
			tenantRepo.findOne?.mockResolvedValue(demoTenant);

			// Mock query for resetDemoLoans
			loanRepo.query?.mockResolvedValue(undefined);

			// Mock delete operations
			bookRepo.delete?.mockResolvedValue(undefined);
			categoryRepo.delete?.mockResolvedValue(undefined);
			publisherRepo.delete?.mockResolvedValue(undefined);
			userTenantRepo.delete?.mockResolvedValue(undefined);

			const seedSpy = jest.spyOn(seeder, 'seed').mockResolvedValue(undefined);

			await seeder.reset();

			expect(tenantRepo.findOne).toHaveBeenCalledWith({
				where: {
					subdomain: 'demo',
				},
			});
			expect(loanRepo.query).toHaveBeenCalledWith(
				expect.stringContaining('DELETE FROM loan'),
				[1],
			);
			expect(bookRepo.delete).toHaveBeenCalledWith({ tenant_id: 1 });
			expect(categoryRepo.delete).toHaveBeenCalledWith({});
			expect(publisherRepo.delete).toHaveBeenCalledWith({});
			expect(userTenantRepo.delete).toHaveBeenCalledWith({ tenant_id: 1 });
			expect(seedSpy).toHaveBeenCalled();
		});

		it('no hace nada si no encuentra tenant demo', async () => {
			tenantRepo.findOne?.mockResolvedValue(null);

			const seedSpy = jest.spyOn(seeder, 'seed');

			await seeder.reset();

			expect(loanRepo.query).not.toHaveBeenCalled();
			expect(seedSpy).not.toHaveBeenCalled();
		});
	});
});
