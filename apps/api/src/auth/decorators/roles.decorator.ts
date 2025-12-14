import {
	ExecutionContext,
	SetMetadata,
	UseGuards,
	applyDecorators,
	createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ROLES } from '@repo/common';
import { RolesGuard } from '../guard/role.guard';

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

export const Roles = (...roles: ROLES[]) =>
	applyDecorators(
		SetMetadata('roles', roles),
		UseGuards(AuthGuard('jwt'), RolesGuard),
	);
