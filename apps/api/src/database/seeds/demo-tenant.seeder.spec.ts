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
import { UserEntity } from '../../users/entities/user.entity';
import { DemoSeeder } from './demo-tenant.seeder';

type MockRepo<T extends ObjectLiteral = any> = Partial<
	Record<keyof Repository<T>, jest.Mock>
>;

function createMockRepo<T extends ObjectLiteral = any>(): MockRepo<T> {
	return {
		findOne: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		delete: jest.fn(),
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
	});

	describe('createDemoTenant', () => {
		it('crea un tenant demo si no existe', async () => {
			tenantRepo.findOne?.mockResolvedValue(null);
			tenantRepo.create?.mockReturnValue({ subdomain: 'demo' });
			tenantRepo.save?.mockResolvedValue({ id: 1, subdomain: 'demo' });

			const result = await seeder['createDemoTenant']();

			expect(tenantRepo.findOne).toHaveBeenCalledWith({
				where: { subdomain: 'demo', deleted_at: expect.any(Object) },
			});
			expect(tenantRepo.create).toHaveBeenCalled();
			expect(tenantRepo.save).toHaveBeenCalled();
			expect(result).toEqual({ id: 1, subdomain: 'demo' });
		});

		it('retorna tenant existente si ya está creado', async () => {
			const existingTenant = { id: 99, subdomain: 'demo' };
			tenantRepo.findOne?.mockResolvedValue(existingTenant);

			const result = await seeder['createDemoTenant']();

			expect(tenantRepo.findOne).toHaveBeenCalled();
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
		it('crea usuarios con password hasheado', async () => {
			userRepo.findOne?.mockResolvedValue(null);
			userRepo.create?.mockImplementation((data) => data);
			userRepo.save?.mockImplementation((data) =>
				Promise.resolve({ id: Date.now(), ...data }),
			);

			const roles: RoleEntity[] = [{ id: 1, name: ROLES.ADMIN } as RoleEntity];

			const result = await seeder['createUsers'](1, roles);

			expect(userRepo.findOne).toHaveBeenCalled();
			expect(userRepo.save).toHaveBeenCalled();
			expect(result[0].password).not.toBe('demo123');
			expect(await bcrypt.compare('demo123', result[0].password)).toBe(true);
		});
	});

	describe('reset', () => {
		it('borra entidades y re-seedea si existe tenant demo', async () => {
			tenantRepo.findOne?.mockResolvedValue({ id: 1, subdomain: 'demo' });

			loanRepo.delete?.mockResolvedValue(undefined);
			bookRepo.delete?.mockResolvedValue(undefined);
			categoryRepo.delete?.mockResolvedValue(undefined);
			publisherRepo.delete?.mockResolvedValue(undefined);
			userRepo.delete?.mockResolvedValue(undefined);
			roleRepo.delete?.mockResolvedValue(undefined);

			const seedSpy = jest.spyOn(seeder, 'seed').mockResolvedValue(undefined);

			await seeder.reset();

			expect(loanRepo.delete).toHaveBeenCalledWith({
				deleted_at: expect.any(Object),
			});
			expect(bookRepo.delete).toHaveBeenCalledWith({ tenant_id: 1 });
			expect(categoryRepo.delete).toHaveBeenCalledWith({ tenant_id: 1 });
			expect(publisherRepo.delete).toHaveBeenCalledWith({ tenant_id: 1 });
			expect(userRepo.delete).toHaveBeenCalledWith({
				userTenants: { tenant_id: 1 },
			});
			expect(roleRepo.delete).toHaveBeenCalled();
			expect(seedSpy).toHaveBeenCalled();
		});

		it('no hace nada si no encuentra tenant demo', async () => {
			tenantRepo.findOne?.mockResolvedValue(null);

			const seedSpy = jest.spyOn(seeder, 'seed');

			await seeder.reset();

			expect(bookRepo.delete).not.toHaveBeenCalled();
			expect(seedSpy).not.toHaveBeenCalled();
		});
	});
});
