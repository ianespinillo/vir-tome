import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/ui/dialog';
import { CircleFadingPlus } from 'lucide-react';
import React, { useState } from 'react';
import { BookForm } from '../forms/book-form';

export const AddBook = () => {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<Button variant="default" className="w-full" onClick={() => setOpen(true)}>
					Añadir libro
					<CircleFadingPlus className="ml-2 h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="p-0">
				<DialogHeader className="hidden">
					<DialogTitle>Add Book</DialogTitle>
				</DialogHeader>
				<BookForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
};
