import { useLoans } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';
import { loanColumn } from '../cells/loans-columns';
import { GenericTable } from './generic-table';

export const LoansTable = () => {
	const { loans, fetchNextPage, fetchPreviousPage } = useLoans();
	return (
		<div className="p-3">
			<GenericTable
				columns={loanColumn as ColumnDef<unknown>[]}
				data={loans?.data?.data ?? []}
				isLoading={loans?.isLoading}
				fetchNextPage={fetchNextPage}
				fetchPreviousPage={fetchPreviousPage}
				currentPage={loans?.data?.current_page ?? 0}
				totalPages={loans?.data?.last_page ?? 0}
				isFetching={loans?.isFetching}
			/>
		</div>
	);
};
