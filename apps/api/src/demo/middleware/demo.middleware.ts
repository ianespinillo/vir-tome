import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
// src/demo/demo.middleware.ts
import { ExtendedRequest } from '../../core/core.types';

@Injectable()
export class DemoMiddleware implements NestMiddleware {
	use(req: ExtendedRequest, res: Response, next: NextFunction) {
		if (req.tenant?.is_demo) {
			// Agregar header indicando modo demo
			res.setHeader('X-Demo-Mode', 'true');
			res.setHeader('X-Demo-Tenant', req.tenant.subdomain);
		}
		next();
	}
}
