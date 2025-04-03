'use client';
import { LoginForm } from '@repo/ui';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function SignInPage() {
	const router = useRouter();
	return <LoginForm onSuccess={() => router.push('/dashboard')} />;
}
