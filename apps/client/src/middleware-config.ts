import { PAYLOAD_TYPE } from './types/payload-type.enum';
import { ROLES } from './types/roles.enum';

// --- CONFIGURACIÓN DE RUTAS PROTEGIDAS ---
export interface RouteConfig {
	path: string;
	requiredRoles?: ROLES[];
	allowAll?: boolean; // Para rutas que solo requieren autenticación
}

// Rutas SUPER_ADMIN exclusivas
const SUPER_ADMIN_ROUTES: RouteConfig[] = [
	{
		path: '/super-admin/dashboard',
		requiredRoles: [ROLES.SUPER_ADMIN],
	},
	{
		path: '/super-admin/tenants',
		requiredRoles: [ROLES.SUPER_ADMIN],
	},
	{
		path: '/super-admin/admins',
		requiredRoles: [ROLES.SUPER_ADMIN],
	},
	{
		path: '/super-admin/activity',
		requiredRoles: [ROLES.SUPER_ADMIN],
	},
];

// Rutas de Dashboard por rol
const DASHBOARD_ROUTES: RouteConfig[] = [
	{
		path: '/dashboard',
		requiredRoles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STUDENT],
	},
	{
		path: '/dashboard/my-loans',
		requiredRoles: [ROLES.STUDENT, ROLES.TEACHER],
	},
	{
		path: '/dashboard/books',
		requiredRoles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		path: '/dashboard/loans',
		requiredRoles: [ROLES.ADMIN, ROLES.LIBRARIAN],
	},
	{
		path: '/dashboard/requests',
		requiredRoles: [ROLES.LIBRARIAN],
	},
	{
		path: '/dashboard/my-users',
		requiredRoles: [ROLES.ADMIN],
	},
	{
		path: '/dashboard/profile',
		allowAll: true, // Solo requiere autenticación
	},
];

// Configuración unificada
export const PROTECTED_ROUTES: RouteConfig[] = [
	...SUPER_ADMIN_ROUTES,
	...DASHBOARD_ROUTES,
];

// Rutas públicas (no requieren autenticación)
export const PUBLIC_ROUTES = [
	'/',
	'/demo',
	'/auth/sign-in',
	'/auth/sign-up',
	'/auth/forgot-password',
	'/404',
	'/500',
];

// --- UTILIDADES DE VALIDACIÓN ---

/**
 * Encuentra la configuración de ruta para un pathname dado
 */
export function findRouteConfig(pathname: string): RouteConfig | null {
	// Primero buscar coincidencias exactas
	const exactMatch = PROTECTED_ROUTES.find((route) => route.path === pathname);
	if (exactMatch) return exactMatch;

	// Luego buscar coincidencias de prefijos (para rutas dinámicas)
	return (
		PROTECTED_ROUTES.find((route) => pathname.startsWith(`${route.path}/`)) ||
		null
	);
}

/**
 * Verifica si una ruta es pública
 */
export function isPublicRoute(pathname: string): boolean {
	return (
		PUBLIC_ROUTES.includes(pathname) ||
		PUBLIC_ROUTES.some((route) => pathname.startsWith(`${route}/`))
	);
}

/**
 * Verifica si el usuario tiene acceso a una ruta
 */
export function hasRouteAccess(pathname: string, userRole: ROLES): boolean {
	const routeConfig = findRouteConfig(pathname);

	// Si no hay configuración, la ruta no está protegida
	if (!routeConfig) return true;

	// Si la ruta permite a todos los usuarios autenticados
	if (routeConfig.allowAll) return true;

	// Verificar si el rol del usuario está en la lista de roles permitidos
	return routeConfig.requiredRoles?.includes(userRole) || false;
}

/**
 * Determina el dashboard apropiado para un usuario
 */
export function getDashboardForUser(
	role: ROLES,
	payloadType?: PAYLOAD_TYPE,
): string {
	// Super Admins van a su dashboard específico
	if (
		payloadType === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN ||
		role === ROLES.SUPER_ADMIN
	) {
		return '/super-admin/dashboard';
	}

	// Todos los demás usuarios van al dashboard principal
	return '/dashboard';
}

/**
 * Determina si un usuario es Super Admin
 */
export function isSuperAdmin(role: ROLES, payloadType?: PAYLOAD_TYPE): boolean {
	return (
		payloadType === PAYLOAD_TYPE.SUPER_ADMIN_LOGIN || role === ROLES.SUPER_ADMIN
	);
}
