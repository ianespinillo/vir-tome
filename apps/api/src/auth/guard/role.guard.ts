// src/auth/guards/roles.guard.ts

import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '@repo/common';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<ROLES[]>('roles', [
			context.getHandler(),
			context.getClass(),
		]);

		if (!requiredRoles) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;
		if (!user.roleName) {
			throw new ForbiddenException('User role not found');
		}

		const hasRole = requiredRoles.includes(user.roleName as ROLES);

		if (!hasRole) {
			throw new ForbiddenException(
				`Access denied. Required roles: ${requiredRoles.join(', ')}`,
			);
		}

		return true;
	}
}
