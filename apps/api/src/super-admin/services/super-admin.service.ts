import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ROLES } from '@repo/common';
import { Repository } from 'typeorm';
import { GenericService } from '../../core/generic.service';
import { PasswordAdapter } from '../../core/passport-adapter';
import { EmailService } from '../../email/email.service';
import { SuperAdminEntity } from '../entities/super-admin.entity';

@Injectable()
export class SuperAdminService extends GenericService {
	constructor(
		@InjectRepository(SuperAdminEntity)
		private readonly superAdminRepo: Repository<SuperAdminEntity>,
		private readonly emailService: EmailService,
	) {
		super(superAdminRepo);
	}

	async createSuperAdmin(data: {
		email: string;
		name?: string;
	}): Promise<SuperAdminEntity> {
		const existing = await this.superAdminRepo.findOne({
			where: { email: data.email },
		});
		if (existing) {
			throw new BadRequestException('Email already in use');
		}

		const { hashedPassword, password } =
			await PasswordAdapter.generateHashedPassword(8);

		const superAdmin = this.superAdminRepo.create({
			email: data.email,
			password: hashedPassword,
			name: data.name,
			role: ROLES.SUPER_ADMIN,
			isActive: true,
		});

		const entity = await this.superAdminRepo.save(superAdmin);
		await this.emailService.sendEmailWelcome({ to: entity.email, password });
		return entity;
	}

	async findByEmail(email: string): Promise<SuperAdminEntity | null> {
		return await this.superAdminRepo.findOne({ where: { email } });
	}

	async validateCredentials(
		email: string,
		password: string,
	): Promise<SuperAdminEntity | null> {
		const user = await this.findByEmail(email);
		if (!user) return null;

		const isMatch: boolean = await PasswordAdapter.comparePassword(
			password,
			user.password,
		);
		return isMatch ? user : null;
	}

	async deactivate(id: number): Promise<void> {
		await this.superAdminRepo.update(id, { isActive: false });
	}
}
