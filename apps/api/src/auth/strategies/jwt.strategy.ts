import { UsersService } from '@/users/services/users.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { IAuthPayload } from '@repo/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

// TODO: implement with multi-tenancy

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
// 	constructor(
// 		private readonly configService: ConfigService,
// 		private readonly userService: UsersService,
// 	) {
// 		super({
// 			jwtFromRequest: ExtractJwt.fromExtractors([
// 				ExtractJwt.fromAuthHeaderAsBearerToken(),
// 				(req: Request) => req.cookies.token ?? null,
// 			]),
// 			ignoreExpiration: false,
// 			secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecretKey'),
// 		});
// 	}

// 	async validate(payload: IAuthPayload) {
// 		const user = await this.findUser(payload.email);
// 		return user;
// 	}

// 	private async findUser(email: string) {
// 		const u = await this.userService.findUserByEmail(email);
// 		if (!u) throw new NotFoundException('User not found');
// 		const { password, ...user } = u;
// 		return user;
// 	}
// }
