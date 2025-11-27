import { SuperAdminService } from '@/super-admin/services/super-admin.service';
import { TenantsService } from '@/tenants/tenants.service';
import { UsersService } from '@/users/services/users.service';
import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
	IAuthPayload,
	ISuperAdminLoginPayload,
	PAYLOAD_TYPE,
} from '@repo/common';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = IAuthPayload | ISuperAdminLoginPayload;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		private readonly configService: ConfigService,
		private readonly userService: UsersService,
		private readonly tenantService: TenantsService,
		private readonly superAdminService: SuperAdminService,
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

	async validate(payload: JwtPayload) {
		switch (payload.type) {
			case PAYLOAD_TYPE.SUPER_ADMIN_LOGIN: {
				const superAdmin = await this.superAdminService.findById(payload.sub);
				if (!superAdmin) {
					throw new UnauthorizedException('Super admin not found');
				}
				return {
					userId: superAdmin.id,
					email: superAdmin.email,
					type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN,
				};
			}

			case PAYLOAD_TYPE.USER_LOGIN: {
				const tenant = await this.tenantService.findById(payload.tenantId);
				if (!tenant) {
					throw new UnauthorizedException('Tenant not found');
				}

				const user = await this.userService.findById(payload.sub);
				if (!user) {
					throw new UnauthorizedException('User not found');
				}
				const inTenant = user.hasAccessToTenant(tenant.id);
				if (!inTenant) {
					throw new UnauthorizedException('User has no access to tenant');
				}
				return {
					userId: user.id,
					email: user.email,
					tenantId: tenant.id,
					roleId: user.getRoleInTenant(tenant.id)?.id || null,
					roleName: user.getRoleInTenant(tenant.id)?.name || null,
					tenant, // full object if your guards need it
					type: PAYLOAD_TYPE.USER_LOGIN,
				};
			}

			default:
				throw new UnauthorizedException('Invalid token payload type');
		}
	}
}
