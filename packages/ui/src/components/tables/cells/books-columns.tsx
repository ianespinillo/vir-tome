'use client';
import { GenericActions } from '@/components/dropdown/generic-actions';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { toTitleCase } from '@/helpers/to-title-case';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/ui/alert-dialog';
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash } from 'lucide-react'; // Replace '@/ui/icons' with the correct module path for ArrowUpDown
import { useState } from 'react';
import { toast } from 'sonner';

export const bookColumns: ColumnDef<IBook>[] = [
	{
		accessorKey: 'id',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'title',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Titulo
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'publisher',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Author
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => row.original.publisher.name,
	},
	{
		accessorKey: 'categories',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Category
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell({ row }) {
			return row.original.categories
				.flatMap((cat) => toTitleCase(cat.name))
				.join(', ');
		},
	},
	{
		accessorKey: 'availableQuantity',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Cantidad disponible
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'publicationYear',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Año de publicación
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'Actions',
		header: 'Acciones',
		cell: ({ row }) => {
			return <BookActions book={row.original} />;
		},
	},
];

function BookActions({ book }: Readonly<{ book: IBook }>) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const {
		setEntity,
		setDetailsOpen,
		setEditOpen,
		hook: { deleteBook },
	} = useModalCrud<IBook, ReturnType<typeof useBooks>>();

	return (
		<>
			<GenericActions
				nodes={[
					{
						id: 1,
						children: 'Ver detalles',
						onClick: () => {
							setEntity(book);
							setDetailsOpen(true);
						},
					},
					{
						id: 2,
						children: (
							<>
								<Pencil className="mr-2 h-4 w-4" />
								Editar
							</>
						),
						className: 'cursor-pointer',
						onClick: () => {
							setEntity(book);
							setEditOpen(true);
						},
					},
					{
						id: 3,
						children: (
							<>
								<Trash className="mr-2 h-4 w-4" />
								Eliminar
							</>
						),
						className: 'text-red-600 focus:text-red-600 cursor-pointer',
						onClick: (e) => {
							e.preventDefault();
							setShowDeleteDialog(true);
						},
					},
				]}
			/>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Se eliminará permanentemente el libro y
							todos sus datos asociados.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-600 hover:bg-red-700"
							onClick={() => {
								toast.promise(deleteBook.mutateAsync(book.id), {
									success: 'Libro eliminado satisfactoriamente',
									error: 'Error al eliminar libro',
								});
							}}
						>
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
