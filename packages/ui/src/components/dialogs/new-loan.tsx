import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';

import { Button } from '@/ui/button';
import { CircleFadingPlus } from 'lucide-react';
import React, { useState } from 'react';
import { LoanForm } from '../forms/loan-form';

export const NewLoan = () => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen} modal>
			<DialogTrigger asChild>
				<Button variant="default" size="sm" onClick={() => setIsOpen(true)}>
					Crear Préstamo
					<CircleFadingPlus className="ml-2 h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="p-0">
				<DialogHeader className="hidden">
					<DialogTitle>Crear Préstamo</DialogTitle>
				</DialogHeader>
				<LoanForm onSuccess={() => setIsOpen(false)} />
			</DialogContent>
		</Dialog>
	);
};
