import { rootDomain } from '@/constants/utils';
import { type NextRequest, NextResponse } from 'next/server';

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

	// Auth protection - check before subdomain logic
	if (pathname.startsWith('/dashboard') && !token) {
		url.pathname = '/auth/sign-in';
		return NextResponse.redirect(url);
	}

	if (pathname.startsWith('/auth') && token) {
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	// Subdomain logic
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

	// On the root domain, allow normal access
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
