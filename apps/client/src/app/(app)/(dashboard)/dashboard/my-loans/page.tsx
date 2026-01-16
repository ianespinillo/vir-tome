'use client';

import { ILoan } from '@repo/common';
import { useMyLoans } from '@repo/hooks';
import {
	AddButton,
	LoanDetailsDialog,
	ModalCrudProvider,
	MyLoansTable,
	RequestLoanDialog,
	Toaster,
	useModalCrud,
} from '@repo/ui';
import React from 'react';
export default function MyLoansPage() {
	return (
		<ModalCrudProvider<ILoan, ReturnType<typeof useMyLoans>> useHook={useMyLoans}>
			<Toaster richColors position="top-right" />
			<div className="flex flex-col gap-6 p-6 h-full w-full">
				<div className="flex justify-end p-2 gap-2">
					<Button />
				</div>
				<div className="w-full">
					<MyLoansTable />
				</div>
			</div>
			<RequestLoanDialog />
			<LoanDetailsDialog />
		</ModalCrudProvider>
	);
}

function Button() {
	const { setCreateOpen } = useModalCrud();
	return <AddButton text="Nueva solicitud" action={() => setCreateOpen(true)} />;
}
