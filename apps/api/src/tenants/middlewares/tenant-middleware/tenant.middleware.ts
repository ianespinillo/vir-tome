import {
	BadRequestException,
	Injectable,
	NestMiddleware,
	NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantEntity } from '../../entities/tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
	constructor(private readonly tenantService: TenantsService) {}

	async use(req: Request, res: Response, next: () => void) {
		let tenant: TenantEntity | null = null;

		tenant =
			(await this.getTenantFromHeader(req)) ??
			(await this.getTenantFromSubdomain(req, next));

		if (tenant) {
			this.validateAndAssignTenant(req, tenant);
		}

		next();
	}

	private async getTenantFromHeader(req: Request): Promise<TenantEntity | null> {
		const header = req.headers['x-tenant-id'] as string;
		if (header) {
			const tenantId = Number.parseInt(header);
			if (!Number.isNaN(tenantId)) {
				const tenant = await this.tenantService.findById(tenantId);
				if (!tenant) {
					throw new NotFoundException(`Tenant with ID ${header} not found`);
				}
				return tenant;
			}
		}
		return null;
	}

	private async getTenantFromSubdomain(
		req: Request,
		next: () => void,
	): Promise<TenantEntity | null> {
		const host = req.get('host') || '';
		const subdomain = this.extractSubdomain(host);

		if (this.isSpecialCase(subdomain, host)) {
			next();
			return null;
		}

		if (subdomain) {
			const tenant = await this.tenantService.findBySubdomain(subdomain);
			if (!tenant) {
				throw new NotFoundException(
					`Tenant with subdomain "${subdomain}" not found`,
				);
			}
			return tenant;
		}
		return null;
	}

	private validateAndAssignTenant(req: Request, tenant: TenantEntity): void {
		if (!tenant.is_active) {
			throw new BadRequestException(`Tenant "${tenant.name}" is inactive`);
		}
		req.tenant = tenant;
		req.tenantId = tenant.id;
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
