import { PAYLOAD_TYPE } from './types/payload-type.enum';
import { ROLES } from './types/roles.enum';

// --- INTERFACES PARA JWT PAYLOAD ---
export interface AuthPayload {
	sub: number; // user_id
	email: string;
	type: PAYLOAD_TYPE;
	tenantId?: number;
	roleId?: number;
	roleName: ROLES;
}

export interface SuperAdminPayload {
	sub: number;
	email: string;
	type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN;
}

export type JwtPayload = AuthPayload | SuperAdminPayload;

// --- UTILIDADES DE JWT PARA MIDDLEWARE ---

/**
 * Decodifica un token JWT sin verificar la firma
 * (Adecuado para middleware de Next.js donde confiamos en el backend)
 */
export function decodeJWT(token: string): JwtPayload | null {
	try {
		// JWT tiene formato: header.payload.signature
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		// Decodificar el payload (parte 2) usando Buffer
		const payload = parts[1];

		// Manejar padding si es necesario
		const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);

		const decoded = Buffer.from(paddedPayload, 'base64').toString('utf8');

		return JSON.parse(decoded) as JwtPayload;
	} catch (error) {
		console.error('Error decoding JWT:', error);
		return null;
	}
}

/**
 * Extrae el rol del usuario desde el token JWT
 */
export function extractRoleFromToken(
	token: string,
): { role: ROLES; type: PAYLOAD_TYPE } | null {
	const payload = decodeJWT(token);

	if (!payload) {
		return null;
	}

	if (payload.type === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN) {
		return {
			role: ROLES.SUPER_ADMIN,
			type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN,
		};
	}

	if ('roleName' in payload) {
		return {
			role: payload.roleName,
			type: payload.type,
		};
	}

	return null;
}

/**
 * Verifica si el token es válido y tiene la estructura esperada
 */
export function isValidToken(token: string): boolean {
	const payload = decodeJWT(token);

	if (!payload) {
		return false;
	}

	// Verificar campos básicos requeridos
	if (!payload.sub || !payload.email || !payload.type) {
		return false;
	}

	// Para usuarios normales, verificar que tengan roleName
	if (
		payload.type !== PAYLOAD_TYPE.SUPER_ADMIN_LOGIN &&
		!('roleName' in payload)
	) {
		return false;
	}

	return true;
}

/**
 * Extrae el ID del usuario desde el token
 */
export function extractUserIdFromToken(token: string): number | null {
	const payload = decodeJWT(token);
	return payload?.sub || null;
}
