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
			<DialogContent>
				<DialogHeader className="hidden">
					<DialogTitle>Add Book</DialogTitle>
				</DialogHeader>
				<div className="py-2">
					<BookForm onSuccess={() => setOpen(false)} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
