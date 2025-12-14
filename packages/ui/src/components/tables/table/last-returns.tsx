import { Card, CardDescription, CardTitle } from '@/ui/card';
import { ILoan } from '@repo/common';
import { useAnalytics } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { LastReturnsColumns } from '../cells/last-returns';
import { SimpleTable } from './simple-table';

export const LastReturnsTable = () => {
	const { lastReturns } = useAnalytics();
	return (
		<Card className="p-4 rounded-lg">
			<CardTitle>Últimas devoluciones</CardTitle>
			<CardDescription>Las últimas devoluciones realizadas</CardDescription>
			<SimpleTable<ILoan> columns={LastReturnsColumns} query={lastReturns} />
		</Card>
	);
};
