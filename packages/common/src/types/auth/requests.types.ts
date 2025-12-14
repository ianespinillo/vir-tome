// @repo/common/src/auth/auth.types.ts

import { PAYLOAD_TYPE } from '../../enum/payload-type.enum';
import { ROLES } from '../../enum/roles.enum';
import { ITenant } from '../entities/tenant.type';
import { IUser } from '../entities/user.type';

/**
 * IRequestUser (a.k.a. SessionUser)
 * Estructura unificada de lo que hay en `req.user` tras pasar por JwtStrategy.
 * Coincide con lo que devuelve el endpoint de Login y /profile.
 */
export interface IRequestUser {
	id: number;
	email: string;
	type: PAYLOAD_TYPE;

	// Propiedades específicas de Tenant (User normal)
	tenantId?: number;
	roleId?: number;
	roleName?: ROLES;

	// Propiedades de Entidad completa.
	// Usamos 'any' porque en el paquete 'common' no tenemos acceso a las clases Entity.
	// En el backend serán instancias de Entity, en el frontend serán objetos JSON planos.
	tenant?: ITenant;
	entity?: any;
}

//valores en string de roles
export type Roles = keyof typeof ROLES;

export interface IAuthResponse {
	access_token: string;
	user: IRequestUser; // Reutilizamos IRequestUser pq tu strategy devuelve esa estructura
	temporary_password?: string; // Solo en register
}
export type IUserResponse = IRequestUser;

export interface ISingleTenantGeneralLogin {
	requiresTenantSelection: boolean;
	access_token: string;
	user: Partial<IUser>;
	tenants: Partial<ITenant>;
}

export interface IMultipleTenantGeneralLogin {
	requiresTenantSelection: boolean;
	user: Partial<IUser>;
	tenants: Partial<ITenant>[];
}

export type IGeneralLoginResponse =
	| ISingleTenantGeneralLogin
	| IMultipleTenantGeneralLogin;

export interface ILoginResponse {
	user: Partial<IRequestUser>;
	access_token: string;
}
export interface ISignUpResponse {
	id: number;
	email: string;
	name: string;
	surname: string;
	tenantId: number;
	roleId: number;
}
