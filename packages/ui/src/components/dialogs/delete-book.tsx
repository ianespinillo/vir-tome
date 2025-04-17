import { booksContext } from '@/contexts/book.context';
import { Button } from '@/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
} from '@/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Trash } from 'lucide-react';
import React, { useContext, useState } from 'react';

interface Props {
	id: number;
	title: string;
}

export const DeleteBook = ({ id, title }: Readonly<Props>) => {
	const { deleteBook, data, setPage } = useContext(booksContext);
	const [isOpen, setIsOpen] = useState(false);
	const handleDelete = () => {
		deleteBook.mutate(id, {
			onSuccess: () => {
				setIsOpen(false);
				if (data.data.length === 1 && data.current_page > 1) {
					setPage(data.current_page - 1);
				}
			},
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="destructive" onClick={() => setIsOpen(true)}>
					Eliminar
					<Trash className="ml-2 h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Eliminar libro</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p>
						¿Estás seguro de que deseas eliminar el libro <strong>{title}</strong>?
						Esta acción no se puede deshacer.
					</p>
					<div className="flex justify-end gap-2">
						<Button variant="outline">Cancelar</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Eliminar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
