'use client';
import { LoginForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SuperAdminLogin() {
	const router = useRouter();
	const handleLogin = async () => {
		router.push('/super-admin/dashboard');
	};
	return <LoginForm onSuccess={handleLogin} />;
}
