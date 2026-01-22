'use client';
import { useAnalytics } from '@repo/hooks';
import { BookCopy } from 'lucide-react';
import React, { useEffect } from 'react';
import { GenericCountCard } from './generic-count';

export const LoansCount = () => {
	const { countLoans } = useAnalytics();
	useEffect(() => {
		countLoans.refetch();
	}, []);
	return (
		<GenericCountCard
			title="Total de prestamos"
			value={countLoans.data?.data ?? 0}
			icon={<BookCopy />}
		/>
	);
};
