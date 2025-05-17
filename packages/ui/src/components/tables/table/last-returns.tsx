import { Card } from '@/ui/card';
import { useAnalytics } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { LastReturnsColumns } from '../cells/last-returns';
import { GenericTable } from './generic-table';

export const LastReturnsTable = () => {
	const { lastReturns } = useAnalytics();
	return (
		<Card className="p-4 rounded-lg">
			<h3 className="text-2xl font-medium text-gray-500">Últimas devoluciones</h3>
			<p className="text-sm font-medium text-gray-500">
				Las últimas 5 devoluciones realizadas
			</p>
			<GenericTable
				data={lastReturns.data}
				columns={LastReturnsColumns as ColumnDef<unknown>[]}
				currentPage={1}
				totalPages={1}
				isLoading={lastReturns.isLoading}
				isFetching={lastReturns.isFetching}
				paginable={false}
			/>
		</Card>
	);
};
