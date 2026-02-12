import { ITenant, IUser, PAYLOAD_TYPE, ROLES } from '@repo/common';
import { Request } from 'express';

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

export interface ExtendedRequest extends Request {
	tenant: ITenant;
	tenantId: number;
	user: IAuthUser;
}
