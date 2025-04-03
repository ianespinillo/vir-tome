'use client';
import { TanstackProvider } from '@repo/hooks';
import React from 'react';

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="min-h-screen">
			<body>
				<TanstackProvider>{children}</TanstackProvider>
			</body>
		</html>
	);
}
