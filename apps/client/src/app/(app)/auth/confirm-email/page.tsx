'use client';
import { ConfirmEmail, SpinnerWithText } from '@repo/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function ConfirmPage() {
	return (
		<Suspense fallback={<SpinnerWithText />}>
			<Content />
		</Suspense>
	);
}

function Content() {
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
