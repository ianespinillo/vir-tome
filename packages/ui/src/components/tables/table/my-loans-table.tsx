import { useModalCrud } from '@/contexts/modal-crud-context';
import { BaseQueriesDto, ILoan } from '@repo/common';
import { useMyLoans } from '@repo/hooks';
import React from 'react';
import { MyLoansColumns } from '../cells/my-loans-colums';
import { PaginableTable } from './paginable-table';

export const MyLoansTable = () => {
	const {
		hook: { getMyLoans },
	} = useModalCrud<
		ILoan,
		BaseQueriesDto<ILoan>,
		ReturnType<typeof useMyLoans>
	>();
	return <PaginableTable columns={MyLoansColumns} query={getMyLoans} />;
};
