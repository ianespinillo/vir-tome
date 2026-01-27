import { useModalCrud } from '@/contexts/modal-crud-context';
import { ILoan, LoanQueriesDTO } from '@repo/common';
import { useLoans } from '@repo/hooks';
import React from 'react';
import { loanColumn } from '../cells/loans-columns';
import { PaginableTable } from './paginable-table';

export const LoansTable = () => {
	const {
		hook: { loans },
	} = useModalCrud<ILoan, LoanQueriesDTO, ReturnType<typeof useLoans>>();
	return (
		<div className="p-5">
			<PaginableTable columns={loanColumn} query={loans} />
		</div>
	);
};
