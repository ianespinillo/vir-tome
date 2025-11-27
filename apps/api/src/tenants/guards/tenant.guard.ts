// src/common/guards/tenant.guard.ts
import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../users/services/users.service';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantsService } from '../tenants.service';

@Injectable()
export class TenantGuard implements CanActivate {
	private readonly logger = new Logger(TenantGuard.name);

	constructor(
		private readonly tenantService: TenantsService,
		private readonly usersService: UsersService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>();

		// Opcional: Excluir rutas públicas
		if (this.isPublicRoute(req)) {
			return true;
		}

		try {
			// 1. Obtener tenant del request
			const tenant = await this.extractTenantFromRequest(req);

			if (!tenant) {
				this.logger.warn(
					`Access attempt without valid tenant from IP: ${req.ip} - Path: ${req.path}`,
				);
				throw new UnauthorizedException('Valid tenant is required');
			}

			// 2. Validar que el usuario (si está autenticado) pertenece al tenant
			await this.validateUserTenantAccess(req, tenant);

			// 3. Asignar tenant al request para uso posterior
			req.tenant = tenant;

			this.logger.log(
				`Tenant access granted for tenant: ${tenant.id} - ${tenant.name}`,
			);
			return true;
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`Tenant guard error: ${error.message}`, error.stack);
				throw error;
			}
			this.logger.error('Unknown error in TenantGuard');
			throw error;
		}
	}

	private isPublicRoute(req: Request): boolean {
		const publicRoutes = [
			'/api/health',
			'/api/docs',
			'/auth/login',
			'/auth/register',
			'/auth/forgot-password',
			'/auth/reset-password',
		];

		// Verificar si la ruta actual coincide con alguna ruta pública
		return publicRoutes.some((route) => {
			// Para rutas exactas
			if (req.path === route) {
				return true;
			}

			// Para prefijos de ruta
			if (req.path.startsWith(route) && route !== '/') {
				return true;
			}

			return false;
		});
	}

	private async extractTenantFromRequest(req: Request) {
		let tenantId: number | null = null;

		// Prioridad 1: Header x-tenant-id
		if (req.headers['x-tenant-id']) {
			tenantId = this.parseTenantId(req.headers['x-tenant-id'] as string);
			if (!tenantId) {
				throw new UnauthorizedException('Invalid tenant ID format');
			}
		}

		// Prioridad 2: Subdomain
		if (!tenantId) {
			const subdomain = this.extractSubdomain(req.hostname);
			if (subdomain && !this.isSpecialSubdomain(subdomain)) {
				const tenant = await this.tenantService.findBySubdomain(subdomain);
				if (tenant) {
					tenantId = tenant.id;
					req.headers['x-tenant-id'] = tenantId.toString();
				}
			}
		}

		if (!tenantId) {
			return null;
		}

		return await this.tenantService.findById(tenantId);
	}

	private async validateUserTenantAccess(req: Request, tenant: TenantEntity) {
		if (req.user) {
			// Pass tenant.id as the first argument (tenantId) and user.id as second argument (id)
			const user = await this.usersService.findById(tenant.id);

			if (!user) {
				throw new ForbiddenException('User not found');
			}

			if (!user.hasAccessToTenant(tenant.id)) {
				this.logger.warn(
					`User ${user.id} attempted to access tenant ${tenant.id} but belongs to tenant ${user
						.getTenants()
						.map((t) => t.id)
						.join(', ')}`,
				);
				throw new ForbiddenException('Access to this tenant is not allowed');
			}
		}
	}

	private parseTenantId(tenantId: string): number | null {
		const id = Number.parseInt(tenantId, 10);
		return Number.isNaN(id) || id <= 0 ? null : id;
	}

	private extractSubdomain(hostname: string): string | null {
		const parts = hostname.split('.');
		return parts.length > 2 ? parts[0] : null;
	}

	private isSpecialSubdomain(subdomain: string): boolean {
		const specialSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
		return specialSubdomains.includes(subdomain);
	}
}
