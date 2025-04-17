'use client';
import { DashSidebar, SidebarProvider } from '@repo/ui';
import React from 'react';
import '@repo/ui/globals.css';
export default function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<SidebarProvider>
			<div className="flex h-screen w-screen flex-row overflow-hidden">
				<DashSidebar />
				<div className="w-full">{children}</div>
			</div>
			;
		</SidebarProvider>
	);
}
