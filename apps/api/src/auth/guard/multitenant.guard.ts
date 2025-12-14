import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import '../../core/core.types';
import { PAYLOAD_TYPE } from '@repo/common';

@Injectable()
export class MultitenantGuard implements CanActivate {
	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest<Request>();
		if (!req.user) throw new UnauthorizedException('Missing user');
		if (req.user.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN) return true;
		if (!req.tenant) throw new UnauthorizedException('Missing tenant');
		if (req.user.hasAccessToTenant(req.tenant.id) === false)
			throw new UnauthorizedException('Access denied: tenant mismatch');
		return true;
	}
}
