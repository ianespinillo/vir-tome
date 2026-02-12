import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { PAYLOAD_TYPE } from '@repo/common';
import { Request } from 'express';
import { IAuthUser } from '../../core/core.types';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class MultitenantGuard implements CanActivate {
	constructor(private readonly userService: UsersService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();
		if (!req.user) throw new UnauthorizedException('Missing user');
		const user = req.user as IAuthUser;
		if (user.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN) return true;
		if (!user.tenant) throw new UnauthorizedException('Missing tenant');
		if (!(await this.userService.hasAccessToTenant(user.id, user.tenantId)))
			throw new UnauthorizedException('Access denied: tenant mismatch');
		return true;
	}
}
