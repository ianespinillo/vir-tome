'use client';
import { PAYLOAD_TYPE } from '@repo/common';
import { useAuth } from '@repo/hooks';
import { DashSidebar, SidebarProvider } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function SuperAdminLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const { session } = useAuth();
	const router = useRouter();
	useEffect(() => {
		if (
			session.status === 'success' &&
			session?.data?.data?.type !== String(PAYLOAD_TYPE.SUPER_ADMIN_LOGIN)
		) {
			router.push('/auth/sign-in');
		}
	}, [session, router]);
	return (
		<SidebarProvider>
			<div className="min-h-svh flex flex-col md:flex-row w-full">
				<DashSidebar />
				{children}
			</div>
		</SidebarProvider>
	);
}
