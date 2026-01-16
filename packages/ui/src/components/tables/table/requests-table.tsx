import { useModalCrud } from '@/contexts/modal-crud-context';
import { ILoan } from '@repo/common';
import { useLoansRequest } from '@repo/hooks';
import React from 'react';
import { requestColumns } from '../cells/requests-columns';
import { PaginableTable } from './paginable-table';

export const RequestTable = () => {
	const {
		hook: { lastRequests },
	} = useModalCrud<ILoan, ReturnType<typeof useLoansRequest>>();
	return (
		<div className="p-5">
			<PaginableTable query={lastRequests} columns={requestColumns} />
		</div>
	);
};
