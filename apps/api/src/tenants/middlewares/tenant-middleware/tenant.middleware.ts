import {
	BadRequestException,
	Injectable,
	NestMiddleware,
	NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ExtendedRequest } from '../../../core/core.types';
import { TenantsService } from '../../../tenants/tenants.service';
import { TenantEntity } from '../../entities/tenant.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
	constructor(private readonly tenantService: TenantsService) {}

	async use(req: ExtendedRequest, res: Response, next: () => void) {
		// Detect tenant from header or subdomain
		const tenant =
			(await this.getTenantFromHeader(req)) ??
			(await this.getTenantFromSubdomain(req));
		if (tenant) {
			this.validateAndAssignTenant(req, tenant);
		}

		return next();
	}

	private async getTenantFromHeader(
		req: ExtendedRequest,
	): Promise<TenantEntity | null> {
		const header = req.headers['x-tenant-id'] as string | undefined;

		if (!header) return null;

		const tenantId = Number.parseInt(header);

		if (Number.isNaN(tenantId)) return null;

		const tenant = await this.tenantService.findById(tenantId);
		if (!tenant) {
			throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
		}

		return tenant;
	}

	private async getTenantFromSubdomain(
		req: ExtendedRequest,
	): Promise<TenantEntity | null> {
		const host = req.get('host') || ''; // Use 'host' instead of 'origin'
		const subdomain = this.extractSubdomain(host);

		if (this.isSpecialCase(subdomain, host)) return null;

		if (!subdomain) return null;

		const tenant = await this.tenantService.findBySubdomain(subdomain);

		if (!tenant) {
			throw new NotFoundException(
				`Tenant with subdomain "${subdomain}" not found`,
			);
		}

		return tenant;
	}

	private validateAndAssignTenant(
		req: ExtendedRequest,
		tenant: TenantEntity,
	): void {
		if (!tenant.is_active) {
			throw new BadRequestException(`Tenant "${tenant.name}" is inactive`);
		}

		// Only assign tenant info — do NOT touch req.user
		req.user.tenant = tenant;
		req.tenant = tenant;
		req.tenantId = tenant.id;
	}

	private extractSubdomain(host: string): string {
		const base = host.split(':')[0]; // Remove port
		const parts = base.split('.');

		// Adjust logic to handle the specific format of your URLs
		if (parts.length > 2 && parts[1] === 'vir-tome' && parts[2] === 'local') {
			return parts[0]; // Return the first part as the subdomain
		}

		return '';
	}

	private isSpecialCase(subdomain: string, host: string): boolean {
		const special = ['www', 'localhost', 'api', 'admin'];
		return special.includes(subdomain) || host === 'tuapp.com';
	}
}
