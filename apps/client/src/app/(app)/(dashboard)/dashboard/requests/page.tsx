'use client';
import { ILoan } from '@repo/common';
import { useLoansRequest } from '@repo/hooks';
import { LoanDetailsDialog, ModalCrudProvider, RequestTable } from '@repo/ui';
import React from 'react';

export default function RequestsPage() {
	return (
		<div className="flex flex-col space-y-4 p-3">
			<div className="flex flex-col space-y-4 p-6">
				<h1 className="text-5xl font-bold text-primary">Solicitudes de préstamo</h1>
				<span className="text-muted-foreground text-xl">
					Estas son las solicitudes de libros actualmente activas
				</span>
			</div>
			<div className="flex flex-col space-y-4 p-2">
				<ModalCrudProvider<ReturnType<typeof useLoansRequest>, ILoan>
					useHook={useLoansRequest}
				>
					<div className="flex flex-col gap-6 p-6 h-full w-full">
						<RequestTable />
					</div>
					<LoanDetailsDialog />
				</ModalCrudProvider>
			</div>
		</div>
	);
}
