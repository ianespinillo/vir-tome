'use client';
import { TanstackProvider } from '@repo/hooks';
import React from 'react';

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div style={{ height: '100vh' }}>
			<TanstackProvider>{children}</TanstackProvider>
		</div>
	);
}
