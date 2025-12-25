'use client';
import 'reflect-metadata';
import { TanstackProvider } from '@repo/hooks';
import { UIConfigProvider } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AppLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	return (
		<div style={{ height: '100vh' }}>
			<TanstackProvider>
				<UIConfigProvider
					value={{
						navigate: (url, options) => {
							if (options?.isExternal || url.includes('.local')) {
								globalThis.location.assign(url);
							}
							router.push(url);
						},
					}}
				>
					{children}
				</UIConfigProvider>
			</TanstackProvider>
		</div>
	);
}
