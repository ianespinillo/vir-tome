'use client';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';

import { LoanContextProvider } from '@/contexts/loan-context';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { CircleFadingPlus } from 'lucide-react';
import React from 'react';
import { LoanForm } from '../../forms/loan/loan-form';

export const NewLoan = () => {
	const { createOpen, setCreateOpen } = useModalCrud();
	return (
		<Dialog open={createOpen} onOpenChange={setCreateOpen} modal>
			<DialogTrigger asChild>
				<Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
					Crear Préstamo
					<CircleFadingPlus className="ml-2 h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent
				className="p-0 min-w-[620px]"
				onInteractOutside={(e) => e.preventDefault()}
				onPointerDownOutside={(e) => e.preventDefault()}
			>
				<DialogHeader className="hidden">
					<DialogTitle>Crear Préstamo</DialogTitle>
				</DialogHeader>
				<LoanContextProvider>
					<LoanForm />
				</LoanContextProvider>
			</DialogContent>
		</Dialog>
	);
};
