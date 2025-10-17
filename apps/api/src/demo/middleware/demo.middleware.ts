// src/demo/demo.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class DemoMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		if (req.tenant?.is_demo) {
			// Agregar header indicando modo demo
			res.setHeader('X-Demo-Mode', 'true');
			res.setHeader('X-Demo-Tenant', req.tenant.subdomain);
		}
		next();
	}
}
