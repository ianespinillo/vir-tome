import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class MultitenantGuard implements CanActivate {
	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest<Request>();
		if (!req.user || !req.tenant)
			throw new UnauthorizedException('Missing user or tenant context');
		if (req.user.tenant_id !== req.tenantId)
			throw new UnauthorizedException('Access denied: tenant mismatch');
		return true;
	}
}
