import { PAYLOAD_TYPE, ROLES } from '@repo/common';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { UserEntity } from '../users/entities/user.entity';

// Definimos la estructura exacta que retorna tu JwtStrategy
export interface IAuthUser {
	id: number;
	email: string;
	type: PAYLOAD_TYPE;
	entity: UserEntity; // Puedes reemplazar 'any' por SuperAdminEntity si la tienes importada
	tenant?: TenantEntity;
	tenantId: number;
	roleId?: number;
	roleName: ROLES;
	hasAccessToTenant: (tenantId: number) => boolean;
	getRoleInTenant: (tenantId: number) => any;
}

declare module 'express' {
	interface Request {
		// Propiedades inyectadas por tu TenantMiddleware
		tenant: TenantEntity;
		tenantId: number;

		// Propiedad inyectada por Passport (ahora fuertemente tipada)
		user: IAuthUser;
	}
}
