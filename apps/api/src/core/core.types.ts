import { TenantEntity } from '../tenants/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity';

declare module 'express' {
	interface Request {
		tenant?: TenantEntity; // agregás la propiedad directo, no dentro del body
		user?: UserEntity; // Puedes definir un tipo más específico si lo deseas
	}
}
