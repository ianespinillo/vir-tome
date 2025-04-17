import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { BookForm } from '../forms/book-form';

interface Props {
	id: number;
}

export const EditBook = ({ id }: Readonly<Props>) => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
					Editar
					<Pencil className="ml-2 h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader className="hidden">
					<DialogTitle>Edit Book</DialogTitle>
				</DialogHeader>
				<div className="py-2">
					<BookForm onSuccess={() => setOpen(false)} id={id} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
