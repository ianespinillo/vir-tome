import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import '../../core/core.types';
import { UsersService } from '@/users/services/users.service';
import { PAYLOAD_TYPE } from '@repo/common';

@Injectable()
export class MultitenantGuard implements CanActivate {
	constructor(private readonly userService: UsersService) {}
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();
		if (!req.user) throw new UnauthorizedException('Missing user');
		if (req.user.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN) return true;
		if (!req.user.tenant) throw new UnauthorizedException('Missing tenant');
		if (
			!(await this.userService.hasAccessToTenant(req.user.id, req.user.tenantId))
		)
			throw new UnauthorizedException('Access denied: tenant mismatch');
		return true;
	}
}
