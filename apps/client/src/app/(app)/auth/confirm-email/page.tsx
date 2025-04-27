'use client';
import { ConfirmEmail } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

export default function ConfirmPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');
	if (!token) {
		router.push('/auth/sign-in');
		return null;
	}
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<ConfirmEmail
				token={token}
				success={() => {
					router.push('/auth/sign-in');
				}}
			/>
		</div>
	);
}
