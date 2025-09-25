import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantEntity } from '../../entities/tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
	constructor(private readonly tenantService: TenantsService) {}

	async use(req: Request, res: Response, next: () => void) {
		let tenant: TenantEntity | null = null;

		// 1. Prioridad al header (para desarrollo/testing)
		const header = req.headers['x-tenant-id'] as string;
		if (header) {
			const tenantId = Number.parseInt(header);
			if (!Number.isNaN(tenantId)) {
				tenant = await this.tenantService.findById(tenantId);
				if (!tenant) {
					throw new NotFoundException(`Tenant with ID ${header} not found`);
				}
			}
		}

		// 2. Extraer del subdomain si no hay header válido
		if (!tenant) {
			const host = req.get('host') || '';
			const subdomain = this.extractSubdomain(host);

			if (this.isSpecialCase(subdomain, host)) {
				return next();
			}

			if (subdomain) {
				tenant = await this.tenantService.findBySubdomain(subdomain);
				if (!tenant) {
					throw new NotFoundException(
						`Tenant with subdomain ${subdomain} not found`,
					);
				}
			}
		}

		// 3. Asignar tenant al request
		if (tenant) {
			req.tenant = tenant;
		}

		next();
	}

	private extractSubdomain(host: string): string {
		const parts = host.split('.');
		const cleanHost = parts[0].split(':')[0];
		return cleanHost;
	}

	private isSpecialCase(subdomain: string, host: string): boolean {
		const specialCases = ['www', 'localhost', 'api', 'admin'];
		return specialCases.includes(subdomain) || host === 'tuapp.com';
	}
}
