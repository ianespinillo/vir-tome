import { Card, CardDescription, CardTitle } from '@/ui/card';
import { ILoan } from '@repo/common';
import { useAnalytics } from '@repo/hooks';
import React from 'react';
import { LastReturnsColumns } from '../cells/last-returns';
import { SimpleTable } from './simple-table';

export const LastReturnsTable = () => {
	const { lastReturns } = useAnalytics();
	return (
		<Card className="p-4 rounded-lg">
			<CardTitle>Últimas devoluciones</CardTitle>
			<CardDescription>Las últimas devoluciones realizadas</CardDescription>
			<SimpleTable<ILoan>
				columns={LastReturnsColumns}
				data={lastReturns.data?.data ?? []}
				isLoading={lastReturns.isLoading}
			/>
		</Card>
	);
};
