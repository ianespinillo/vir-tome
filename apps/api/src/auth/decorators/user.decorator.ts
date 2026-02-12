import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { IAuthUser } from '../../core/core.types';

export const User = createParamDecorator((_: any, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.user as IAuthUser;
});

export const CurrentUserId = createParamDecorator(
	(_: any, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user?.userId;
	},
);
