'use client';

import { BaseQueriesDto, ILoan } from '@repo/common';
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
		<ModalCrudProvider<
			ReturnType<typeof useMyLoans>,
			ILoan,
			BaseQueriesDto<ILoan>
		>
			useHook={useMyLoans}
		>
			<Toaster richColors position="top-right" />
			<div className="flex flex-col gap-6 p-6 h-full w-full">
				<div className="flex justify-between items-center p-2 gap-2">
					<div>
						<h1 className="text-5xl font-bold text-primary">Mis Préstamos</h1>
						<span className="text-muted-foreground text-xl">
							Estos son tus prestamos en curso o finalizados
						</span>
					</div>
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
