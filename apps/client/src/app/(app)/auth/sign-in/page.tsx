'use client';
import { LoginForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SignInPage() {
	const router = useRouter();
	const handleLogin = async () => {
		router.push('/dashboard');
	};
	return <LoginForm onSuccess={handleLogin} />;
}
