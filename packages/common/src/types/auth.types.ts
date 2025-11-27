// @repo/common/src/auth/auth.types.ts

import { PAYLOAD_TYPE } from '../enum/payload-type.enum';
import { ROLES } from '../enum/roles.enum';
/**
 * JWT Payload - Lo que va dentro del token
 */
export interface IAuthPayload extends BasePayload {
	tenantId: number;
	roleId: number; // Un solo rol por usuario en cada tenant
	type: PAYLOAD_TYPE.USER_LOGIN;
}
interface BasePayload {
	sub: number; // user_id
	email: string;
	type: PAYLOAD_TYPE;
}

/**
 * Auth Response - Lo que devuelve login/register
 */
export interface IAuthResponse {
	access_token: string;
	user: IUserResponse;
	temporary_password?: string; // Solo en register
}

/**
 * User Response - Datos del usuario autenticado
 */
export interface IUserResponse {
	id: number;
	email: string;
	name: string;
	surname: string;
	tenant_id: number;
	roleId: number;
}

/**
 * Request User - Lo que estará en req.user después del JWT Strategy
 * (Issue #22)
 */
export interface IRequestUser {
	userId: number;
	email: string;
	tenantId: number;
	roleId: number;
	roleName: ROLES; // Para usar en guards/decoradores
}

export interface ISuperAdminLoginPayload extends BasePayload {
	type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN;
}
