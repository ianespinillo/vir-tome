import {
	ExecutionContext,
	SetMetadata,
	createParamDecorator,
} from '@nestjs/common';
import { ROLES } from '@repo/common';

// Extrae el roleId
export const CurrentRoleId = createParamDecorator(
	(_: any, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user?.roleId;
	},
);

// Extrae el roleName
export const CurrentRole = createParamDecorator(
	(_: any, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user?.roleName;
	},
);

export const Roles = (...roles: ROLES[]) => SetMetadata('roles', roles);
