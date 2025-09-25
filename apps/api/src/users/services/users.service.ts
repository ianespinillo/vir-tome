import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from '@repo/common';
import { Repository } from 'typeorm';
import { GenericService } from '../../core/generic.service';
import { PasswordAdapter } from '../../core/passport-adapter';
import { EmailService } from '../../email/email.service';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UsersService extends GenericService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly emailService: EmailService,
	) {
		super(userRepository);
	}
	async createUser(user: SignUpDto): Promise<UserEntity> {
		const exists = await this.findUserByEmail(user.email);
		if (exists) {
			throw new BadRequestException('User already exists');
		}
		const password = await PasswordAdapter.generateHashedPassword(8);
		const newUser = this.userRepository.create({
			name: user.name,
			email: user.email,
			surname: user.surname,
			password: password.hashedPassword,
		});
		const savedUser = await this.userRepository.save(newUser);
		await this.emailService.sendEmailWelcome({
			to: user.email,
			password: password.password,
		});
		return savedUser;
	}
	async findUserByEmail(email: string): Promise<UserEntity | null> {
		return this.userRepository.findOne({ where: { email } });
	}
}
