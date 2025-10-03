// @repo/common/src/auth/auth.types.ts

/**
 * JWT Payload - Lo que va dentro del token
 */
export interface IAuthPayload {
	sub: number; // user_id
	email: string;
	tenantId: number;
	roleId: number; // Un solo rol por usuario en cada tenant
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
	roleName: string; // Para usar en guards/decoradores
}
