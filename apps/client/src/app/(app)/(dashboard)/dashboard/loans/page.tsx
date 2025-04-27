'use client';
import { LoansTable, NewLoan } from '@repo/ui';
import React, { useEffect, useState } from 'react';
export default function BooksPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient ? (
		<div>
			<div className="px-8 py-5">
				<h1 className="text-5xl font-bold text-primary">Prestamos</h1>
				<span className="text-muted-foreground text-xl">
					Estos son los prestamos en curso o finalizados
				</span>
			</div>
			<div className="px-5 flex justify-end">
				<NewLoan />
			</div>
			<LoansTable />
		</div>
	) : null;
}
