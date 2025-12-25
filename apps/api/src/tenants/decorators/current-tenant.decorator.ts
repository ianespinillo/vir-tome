import {
	ExecutionContext,
	SetMetadata,
	createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import { TenantEntity } from '../entities/tenant.entity';

export const CurrentTenant = createParamDecorator(
	(_, ctx: ExecutionContext) => {
		const req: Request = ctx.switchToHttp().getRequest<Request>();
		return req.tenant;
	},
);
