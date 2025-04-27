import { NextRequest, NextResponse } from 'next/server';

export default async function middleware(req: NextRequest) {
	const token = req.cookies.get('token')?.value;
	const url = req.nextUrl.clone();

	if (url.pathname.startsWith('/dashboard') && !token) {
		url.pathname = '/auth/sign-in';
		return NextResponse.redirect(url);
	}
	if (url.pathname.startsWith('/auth') && token) {
		url.pathname = '/dashboard';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

// 🔥 Este config evita interceptar _next, static, etc.
export const config = {
	matcher: [
		'/dashboard/:path*', // Solo dashboard
		'/auth/:path*', // Solo auth
	],
};
