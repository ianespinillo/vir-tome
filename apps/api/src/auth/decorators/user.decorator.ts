import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((_: any, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	return request.user;
});

export const CurrentUserId = createParamDecorator(
	(_: any, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		return request.user?.userId;
	},
);
