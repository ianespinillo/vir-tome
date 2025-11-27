import { PasswordAdapter } from '@/core/passport-adapter';
import { EmailService } from '@/email/email.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import { Repository } from 'typeorm';
import { SuperAdminEntity } from '../entities/super-admin.entity';
import { SuperAdminService } from './super-admin.service';
import 'reflect-metadata';

describe('SuperAdminService', () => {
	let service: SuperAdminService;
	let repo: jest.Mocked<Repository<SuperAdminEntity>>;
	let emailService: jest.Mocked<EmailService>;

	beforeEach(async () => {
		const repoMock: Partial<jest.Mocked<Repository<SuperAdminEntity>>> = {
			findOne: jest.fn(),
			create: jest.fn(),
			save: jest.fn(),
			update: jest.fn(),
		};

		emailService = {
			sendEmailWelcome: jest.fn(),
		} as any;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SuperAdminService,
				{
					provide: getRepositoryToken(SuperAdminEntity),
					useValue: repoMock,
				},
				{
					provide: EmailService,
					useValue: emailService,
				},
			],
		}).compile();

		service = module.get(SuperAdminService);
		repo = module.get(getRepositoryToken(SuperAdminEntity));
	});

	// ---------------------------------------------------------------------------
	// CREATE SUPER ADMIN
	// ---------------------------------------------------------------------------

	it('should create a super admin', async () => {
		repo.findOne.mockResolvedValue(null);

		const hashedPassword = 'hashed123';
		const rawPassword = 'abc12345';

		jest.spyOn(PasswordAdapter, 'generateHashedPassword').mockResolvedValue({
			hashedPassword,
			password: rawPassword,
		});

		const createdEntity = {
			id: 1,
			email: 'test@admin.com',
			password: hashedPassword,
			name: 'John',
			role: ROLES.SUPER_ADMIN,
			isActive: true,
		};

		repo.create.mockReturnValue(createdEntity as any);
		repo.save.mockResolvedValue(createdEntity as any);

		const result = await service.createSuperAdmin({
			email: 'test@admin.com',
			name: 'John',
		});

		expect(repo.findOne).toHaveBeenCalledWith({
			where: { email: 'test@admin.com' },
		});

		expect(emailService.sendEmailWelcome).toHaveBeenCalledWith({
			to: 'test@admin.com',
			password: rawPassword,
		});

		expect(result).toEqual(createdEntity);
	});

	it('should throw error if email already exists', async () => {
		repo.findOne.mockResolvedValue({ id: 1 } as any);

		await expect(
			service.createSuperAdmin({ email: 'exists@test.com' }),
		).rejects.toThrow(BadRequestException);
	});

	// ---------------------------------------------------------------------------
	// FIND BY EMAIL
	// ---------------------------------------------------------------------------

	it('should find a super admin by email', async () => {
		const entity = { id: 1, email: 'admin@test.com' } as SuperAdminEntity;
		repo.findOne.mockResolvedValue(entity);

		const result = await service.findByEmail('admin@test.com');

		expect(repo.findOne).toHaveBeenCalledWith({
			where: { email: 'admin@test.com' },
		});

		expect(result).toEqual(entity);
	});

	// ---------------------------------------------------------------------------
	// VALIDATE CREDENTIALS  (UPDATED)
	// ---------------------------------------------------------------------------

	it('should return user if password matches', async () => {
		const entity = {
			id: 1,
			email: 'admin@test.com',
			password: 'hashed',
		} as any;

		jest.spyOn(service, 'findByEmail').mockResolvedValue(entity);

		jest.spyOn(PasswordAdapter, 'comparePassword').mockResolvedValue(true);

		const result = await service.validateCredentials('admin@test.com', '123');

		expect(result).toEqual(entity);
	});

	it('should return null if password does not match', async () => {
		const entity = { email: 'x', password: 'hashed' } as any;

		jest.spyOn(service, 'findByEmail').mockResolvedValue(entity);

		jest.spyOn(PasswordAdapter, 'comparePassword').mockResolvedValue(false);

		const result = await service.validateCredentials('a@a', 'wrong');

		expect(result).toBeNull();
	});

	it('should return null if user not found', async () => {
		jest.spyOn(service, 'findByEmail').mockResolvedValue(null);

		const result = await service.validateCredentials('x', 'y');

		expect(result).toBeNull();
	});

	// ---------------------------------------------------------------------------
	// DEACTIVATE
	// ---------------------------------------------------------------------------

	it('should deactivate a super admin', async () => {
		repo.update.mockResolvedValue(undefined as any);

		await service.deactivate(10);

		expect(repo.update).toHaveBeenCalledWith(10, { isActive: false });
	});
});
