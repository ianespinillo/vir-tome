import { Card, CardDescription, CardTitle } from '@/ui/card';
import { ILoan } from '@repo/common';
import { useAnalytics } from '@repo/hooks';
import React from 'react';
import { LastLoansColumns } from '../cells/last-loans';
import { SimpleTable } from './simple-table';

export const LastLoansTable = () => {
	const { lastLoans } = useAnalytics();
	return (
		<Card className="p-4 rounded-lg">
			<CardTitle>Últimos préstamos</CardTitle>
			<CardDescription>Los últimos préstamos realizados</CardDescription>
			<SimpleTable<ILoan> columns={LastLoansColumns} query={lastLoans} />
		</Card>
	);
};
