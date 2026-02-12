import { ExtendedRequest } from '@/core/core.types';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
	(_, ctx: ExecutionContext) => {
		const req = ctx.switchToHttp().getRequest<ExtendedRequest>();
		return req.tenant;
	},
);
