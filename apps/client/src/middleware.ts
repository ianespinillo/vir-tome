import { rootDomain } from '@/constants/utils';
import { type NextRequest, NextResponse } from 'next/server';
import {
	getDashboardForUser,
	hasRouteAccess,
	isPublicRoute,
} from './middleware-config';
import { extractRoleFromToken, isValidToken } from './middleware-jwt-utils';

function extractSubdomain(request: NextRequest): string | null {
	const url = request.url;
	const host = request.headers.get('host') || '';
	const hostname = host.split(':')[0];

	// Local development environment
	if (url.includes('localhost') || url.includes('127.0.0.1')) {
		// Try to extract subdomain from the full URL
		const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
		if (fullUrlMatch?.[1]) {
			return fullUrlMatch[1];
		}

		// Fallback to host header approach
		if (hostname.includes('.localhost')) {
			return hostname.split('.')[0];
		}

		return null;
	}

	// Production environment
	const rootDomainFormatted = rootDomain.split(':')[0];

	// Handle preview deployment URLs (tenant---branch-name.vercel.app)
	if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
		const parts = hostname.split('---');
		return parts.length > 0 ? parts[0] : null;
	}

	// Regular subdomain detection
	const isSubdomain =
		hostname !== rootDomainFormatted &&
		hostname !== `www.${rootDomainFormatted}` &&
		hostname.endsWith(`.${rootDomainFormatted}`);

	return isSubdomain ? hostname.replace(`.${rootDomainFormatted}`, '') : null;
}

async function validateTenant(subdomain: string): Promise<boolean> {
	try {
		const apiUrl = process.env.NEXT_API_URL;

		if (!apiUrl) {
			console.error('NEXT_API_URL is not defined');
			return false;
		}

		const response = await fetch(`${apiUrl}/tenants/subdomain/${subdomain}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			// Add cache control for better performance
			next: { revalidate: 60 }, // Cache for 60 seconds
		});

		// If tenant exists (200 OK), return true
		if (response.ok) {
			const tenant = await response.json();
			return !!tenant; // Ensure we have data
		}

		// If tenant doesn't exist (404 or other error), return false
		return false;
	} catch (error) {
		console.error('Error validating tenant:', error);
		// In case of network errors, fail closed (return false)
		return false;
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const token = request.cookies.get('access_token')?.value;
	const url = request.nextUrl.clone();
	const subdomain = extractSubdomain(request);

	// 1. Rutas públicas - permitir acceso sin autenticación
	if (isPublicRoute(pathname)) {
		// Si ya está autenticado y trata de acceder a auth, redirigir a su dashboard
		if (pathname.startsWith('/auth') && token && isValidToken(token)) {
			const roleInfo = extractRoleFromToken(token);
			if (roleInfo) {
				const dashboardPath = getDashboardForUser(roleInfo.role, roleInfo.type);
				url.pathname = dashboardPath;
				// Remover subdominio para auth
				const host = request.headers.get('host') || '';
				const newHost = host.includes('.')
					? host.split('.').slice(-2).join('.')
					: host;
				url.host = newHost;
				return NextResponse.redirect(url);
			}
		}
		return NextResponse.next();
	}

	// 2. Verificar autenticación para rutas protegidas
	if (!token || !isValidToken(token)) {
		// Redirigir a auth/sign-in SIN subdominio
		url.pathname = '/auth/sign-in';
		const host = request.headers.get('host') || '';
		const newHost = host.includes('.')
			? host.split('.').slice(-2).join('.')
			: host;
		url.host = newHost;
		return NextResponse.redirect(url);
	}

	// 3. Extraer información del usuario y verificar acceso por rol
	const roleInfo = extractRoleFromToken(token);
	if (!roleInfo) {
		// Token inválido o malformed
		url.pathname = '/auth/sign-in';
		const host = request.headers.get('host') || '';
		const newHost = host.includes('.')
			? host.split('.').slice(-2).join('.')
			: host;
		url.host = newHost;
		return NextResponse.redirect(url);
	}

	// 4. Verificar acceso a la ruta específica
	if (!hasRouteAccess(pathname, roleInfo.role)) {
		// Usuario autenticado pero sin acceso a esta ruta
		// Redirigir al dashboard correspondiente a su rol
		const dashboardPath = getDashboardForUser(roleInfo.role, roleInfo.type);
		url.pathname = dashboardPath;
		return NextResponse.redirect(url);
	}

	// 5. Lógica de subdominios (después de la validación de autenticación)
	if (subdomain) {
		// Validate if the tenant exists via API
		const tenantExists = await validateTenant(subdomain);

		if (!tenantExists) {
			// Redirect to a 404 or error page if tenant doesn't exist
			return NextResponse.redirect(new URL('/404', request.url));
		}

		// Block access to admin page from subdomains
		if (pathname.startsWith('/admin')) {
			return NextResponse.redirect(new URL('/', request.url));
		}

		// Block access to dashboard from subdomains (force to main domain)
		if (pathname.startsWith('/dashboard')) {
			return NextResponse.redirect(new URL('/dashboard', `https://${rootDomain}`));
		}

		// For the root path on a subdomain, rewrite to the subdomain page
		if (pathname === '/') {
			return NextResponse.rewrite(new URL(`/s/${subdomain}`, request.url));
		}
	}

	// 6. Permitir acceso normal
	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all paths except for:
		 * 1. /api routes
		 * 2. /_next (Next.js internals)
		 * 3. /_static (static files)
		 * 4. /_vercel (Vercel internals)
		 * 5. all root files inside /public (e.g. /favicon.ico)
		 */
		'/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
	],
};
