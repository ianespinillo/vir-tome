import { PAYLOAD_TYPE } from '../../enum/payload-type.enum';

interface BasePayload {
	sub: number; // user_id
	email: string;
	type: PAYLOAD_TYPE;
}

/**
 * JWT Payload - Lo que viaja encriptado dentro del token
 */
export interface IAuthPayload extends BasePayload {
	tenantId: number;
	roleId?: number; // Opcional pq el superadmin no tiene roleId de tenant
	type: PAYLOAD_TYPE.USER_LOGIN;
}

export interface ISuperAdminLoginPayload extends BasePayload {
	type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN;
}
