import { ITenant, IUser, PAYLOAD_TYPE, ROLES } from '@repo/common';

// Definimos la estructura exacta que retorna tu JwtStrategy
export interface IAuthUser {
	id: number;
	email: string;
	type: PAYLOAD_TYPE;
	entity: IUser; // Puedes reemplazar 'any' por SuperAdminEntity si la tienes importada
	tenant?: ITenant;
	tenantId: number;
	roleId?: number;
	roleName: ROLES;
	hasAccessToTenant: (tenantId: number) => boolean;
	getRoleInTenant: (tenantId: number) => any;
}

declare module 'express' {
	interface Request {
		// Propiedades inyectadas por tu TenantMiddleware
		tenant: ITenant;
		tenantId: number;

		// Propiedad inyectada por Passport (ahora fuertemente tipada)
		user: IAuthUser;
	}
}
