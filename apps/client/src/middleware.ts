import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Forzamos el uso de Node.js si tienes problemas con DTOs en el fetch
export const runtime = 'nodejs';

async function validateTenant(subdomain: string): Promise<boolean> {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Usa la variable pública que definimos para Render
	if (!apiUrl) return false;

	try {
		const response = await fetch(`${apiUrl}/tenants/subdomain/${subdomain}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			// Eliminamos credentials: 'include' para evitar errores en Edge
			next: { revalidate: 3600 }, // Cacheamos por 1 hora para no saturar a Render
		});

		return response.ok;
	} catch (error) {
		return false;
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const segments = pathname.split('/').filter(Boolean);
	const firstSegment = segments[1];

	// Evitar procesar archivos estáticos o la propia ruta de destino interna
	if (
		firstSegment === 's' ||
		firstSegment === '_next' ||
		pathname.includes('.')
	) {
		return NextResponse.next();
	}

	const fixedRoutes = ['demo-info', 'auth', 'dashboard', 'super-admin', 'api'];
	if (fixedRoutes.includes(firstSegment)) {
		return NextResponse.next();
	}

	if (firstSegment === 'app') {
		const slug = segments[2];
		if (!slug) return NextResponse.redirect(new URL('/404', request.url));

		// Validación contra tu API en Render
		const tenantExists = await validateTenant(slug);
		if (!tenantExists) {
			return NextResponse.redirect(new URL('/404', request.url));
		}

		// Reescritura interna: El usuario ve /app/biblioteca pero Next lee /s/biblioteca
		// Esto mantiene los subdominios dinámicos funcionando en Vercel
		return NextResponse.rewrite(
			new URL(
				`/s/${slug}${pathname.replace(String().concat('/app/', slug), '')}`,
				request.url,
			),
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)'],
};
