import {
	BadRequestException,
	Injectable,
	NestMiddleware,
	NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
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
		const host = req.path || ''; // Use 'host' instead of 'origin'
		const subpath = this.extractSubPath(host);

		if (this.isSpecialCase(subpath, host)) return null;

		if (!subpath) return null;

		const tenant = await this.tenantService.findBySubdomain(subpath);

		if (!tenant) {
			throw new NotFoundException(`Tenant with subdomain "${subpath}" not found`);
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

	private extractSubPath(path: string): string {
		const base = path.split('/').filter(Boolean);
		// Adjust logic to handle the specific format of your URLs
		if (base.length > 1 && base[0] === 'app') {
			return base[1];
		}
		return '';
	}

	private isSpecialCase(subdomain: string, host: string): boolean {
		const special = ['www', 'localhost', 'api', 'admin'];
		return special.includes(subdomain) || host === 'tuapp.com';
	}
}
