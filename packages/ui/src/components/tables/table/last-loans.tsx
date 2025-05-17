import { Loading } from '@/components/spinners/loading';
import { Card } from '@/ui/card';
import { useAnalytics } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import React, { useEffect } from 'react';
import { LastLoansColumns } from '../cells/last-loans';
import { GenericTable } from './generic-table';

export const LastLoansTable = () => {
	const { lastLoans } = useAnalytics();
	if (lastLoans.isLoading) return <Loading />;
	return (
		<Card className="p-4 rounded-lg">
			<h3 className="text-2xl font-medium text-gray-500">Últimos préstamos</h3>
			<p className="text-sm font-medium text-gray-500">
				Los últimos 5 préstamos realizados
			</p>
			<div className="max-h-[450px]">
				<GenericTable
					data={lastLoans.data}
					columns={LastLoansColumns as ColumnDef<unknown>[]}
					currentPage={1}
					totalPages={1}
					isLoading={lastLoans.isLoading}
					isFetching={lastLoans.isFetching}
					paginable={false}
				/>
			</div>
		</Card>
	);
};
