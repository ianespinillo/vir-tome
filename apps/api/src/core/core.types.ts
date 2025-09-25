import { TenantEntity } from '../tenants/entities/tenant.entity';

declare module 'express' {
	interface Request {
		tenant?: TenantEntity; // agregás la propiedad directo, no dentro del body
	}
}
