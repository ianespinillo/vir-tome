import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { ROLES } from '@repo/common';

// src/auth/guards/super-admin.guard.ts
@Injectable()
export class SuperAdminGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (!user || user.roleName !== ROLES.SUPER_ADMIN) {
			throw new ForbiddenException('Super Admin access required');
		}

		return true;
	}
}
