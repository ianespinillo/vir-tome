import { PasswordAdapter } from '@/core/passport-adapter';
import { UsersService } from '@/users/services/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthPayload, SignUpDto } from '@repo/common';
import { SignInDto } from '@repo/common/src/dto/auth/sign-in.dto';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	async signUp(payload: SignUpDto) {
		const user = await this.usersService.findUserByEmail(payload.email);
		if (user) {
			throw new BadRequestException('Email ya en uso');
		}
		return await this.usersService.createUser(payload);
	}
	async signIn(payload: SignInDto) {
		const user = await this.usersService.findUserByEmail(payload.email);
		if (!user) {
			throw new BadRequestException('Email no encontrado');
		}
		const isPasswordValid = await PasswordAdapter.comparePassword(
			payload.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new BadRequestException('Contraseña incorrecta');
		}
		const jwtPayload: IAuthPayload = {
			sub: user.id,
			email: user.email,
		};
		const token = this.jwtService.sign(jwtPayload);
		return token.toString();
	}
}
