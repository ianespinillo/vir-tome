import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '@repo/common';
import { Repository } from 'typeorm';
import { MultiTenantService } from '../../core/multi-tenat.service';
import { PasswordAdapter } from '../../core/passport-adapter';
import { EmailService } from '../../email/email.service';
import { UserEntity } from '../entities/user.entity';
import { RoleService } from './role.service';

@Injectable()
export class UsersService extends MultiTenantService<UserEntity> {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly emailService: EmailService,
		private readonly roleService: RoleService,
	) {
		super(userRepository);
	}
	async createUser(user: SignUpDto, tenantId: number): Promise<UserEntity> {
		const exists = await this.findUserByEmail(user.email, tenantId);
		if (exists) {
			throw new BadRequestException('User already exists');
		}
		const role = await this.roleService.findById(tenantId, user.roleId);
		if (!role) throw new BadRequestException('Role does not exist');
		const password = await PasswordAdapter.generateHashedPassword(8);
		const newUser = this.userRepository.create({
			name: user.name,
			email: user.email,
			surname: user.surname,
			password: password.hashedPassword,
			role: {
				id: user.roleId,
			},
			tenant_id: tenantId,
		});
		const savedUser = await this.userRepository.save(newUser);
		await this.emailService.sendEmailWelcome({
			to: user.email,
			password: password.password,
		});
		return savedUser;
	}
	async findUserByEmail(
		email: string,
		tenantId: number,
	): Promise<UserEntity | null> {
		return this.userRepository.findOne({
			where: { email, tenant_id: tenantId },
		});
	}
	async findActiveUsers(tenantId: number): Promise<UserEntity[]> {
		return this.userRepository.find({ where: { tenant_id: tenantId } });
	}

	async getUserStats(tenantId: number): Promise<{
		total: number;
		active: number;
		withTokens: number;
	}> {
		const stats = await this.getStats(tenantId);

		// Contar usuarios con tokens activos
		const withTokens = await this.repository
			.createQueryBuilder('user')
			.innerJoin('user.tokens', 'token')
			.where('user.tenant_id = :tenantId', { tenantId })
			.andWhere('user.deleted_at IS NULL')
			.andWhere('token.expires_at > :now', { now: new Date() })
			.getCount();

		return {
			total: stats.total,
			active: stats.active,
			withTokens,
		};
	}
}
