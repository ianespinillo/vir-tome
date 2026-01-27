import { useMediaQuery } from '@/hooks/use-media-query';
import { Card, CardDescription, CardTitle } from '@/ui/card';
import { MostLoanedBooks } from '@repo/common';
import { useAnalytics } from '@repo/hooks';
import React from 'react';
import { MostLoanedBooksColumns } from '../cells/most-loaned-books';
import { SimpleTable } from './simple-table';

export const MostLoanedBooksTable = () => {
	const isLarge = useMediaQuery('(min-width: 1550px)');
	const { mostLoanedBooks } = useAnalytics(isLarge ? 5 : 3);
	return (
		<Card className="p-4 rounded-lg">
			<CardTitle>Últimos préstamos</CardTitle>
			<CardDescription>Los últimos 5 préstamos realizados</CardDescription>
			<SimpleTable<MostLoanedBooks>
				columns={MostLoanedBooksColumns}
				data={mostLoanedBooks.data?.data ?? []}
				isLoading={mostLoanedBooks.isLoading}
			/>
		</Card>
	);
};
