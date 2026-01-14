'use client';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import React from 'react';
import { BookForm } from '../../forms/book-form';

export const AddBook = () => {
	const { createOpen, setCreateOpen } = useModalCrud();
	return (
		<Dialog open={createOpen} onOpenChange={setCreateOpen}>
			<DialogContent className="p-0">
				<DialogHeader className="hidden">
					<DialogTitle>Add Book</DialogTitle>
				</DialogHeader>
				<BookForm />
			</DialogContent>
		</Dialog>
	);
};
