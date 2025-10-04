import { TenantsService } from '@/tenants/tenants.service';
import { UsersService } from '@/users/services/users.service';
import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { IAuthPayload } from '@repo/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

// TODO: implement with multi-tenancy

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		private readonly configService: ConfigService,
		private readonly userService: UsersService,
		private readonly tenantService: TenantsService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				ExtractJwt.fromAuthHeaderAsBearerToken(),
				(req: Request) => req.cookies.token ?? null,
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecretKey'),
		});
	}

	async validate(payload: IAuthPayload) {
		if (!payload.sub || !payload.tenantId)
			throw new UnauthorizedException('Invalid token payload');
		const t = await this.findTenant(payload.tenantId);
		const user = await this.findUser(payload.sub, payload.tenantId);
		// ✅ DEBERÍA SER (más limpio):
		return {
			userId: user.id,
			email: user.email,
			tenantId: t.id,
			roleId: user.role.id,
			roleName: user.role.name,
			tenant: t, // Objeto completo para guards
		};
	}
	private async findTenant(tenantId: number) {
		const t = await this.tenantService.findById(tenantId);
		if (!t) throw new UnauthorizedException('Tenant not found');
		if (!t.is_active) throw new UnauthorizedException('Tenant is inactive');
		return t;
	}
	private async findUser(sub: number, tenantId: number) {
		const u = await this.userService.findById(tenantId, sub);
		if (!u) throw new UnauthorizedException('User not found in tenant');
		const { password, ...user } = u;
		return user;
	}
}
