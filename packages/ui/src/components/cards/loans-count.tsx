import { useAnalytics } from '@repo/hooks';
import { BookCopy } from 'lucide-react';
import React, { useEffect } from 'react';
import { GenericCountCard } from './generic-count';

export const LoansCount = () => {
	const { countLoans } = useAnalytics();
	useEffect(() => countLoans.mutate(), []);
	if (!countLoans.data) return null;
	return (
		<GenericCountCard
			title="Total de prestamos"
			value={countLoans.data}
			icon={<BookCopy />}
		/>
	);
};
