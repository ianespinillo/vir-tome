'use client';
import { GenericActions } from '@/components/dropdown/generic-actions';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { copyId } from '@/helpers/clipboard-helper';
import { Button } from '@/ui/button';
import { IUser, ROLES, UsersQueriesDto } from '@repo/common';
import { useUsers } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown, Trash } from 'lucide-react';
import { toast } from 'sonner';

export const userColumns: ColumnDef<IUser>[] = [
	{
		accessorKey: 'name',
		header({ column }) {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Nombre
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'email',
		header({ column }) {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Email
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header({ column }) {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Se unio el
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
	},
	{
		id: 'actions',
		cell: ({ row, table }) => <UserActions user={row.original} />,
	},
];

function UserActions({ user }: Readonly<{ user: IUser }>) {
	const { setEntity, setDetailsOpen } = useModalCrud<
		IUser,
		UsersQueriesDto,
		ReturnType<typeof useUsers>
	>();
	return (
		<GenericActions
			nodes={[
				{
					id: 1,
					children: 'Ver detalles',
					onClick() {
						setEntity(user);
						setDetailsOpen(true);
					},
				},
				{
					id: 2,
					children: 'Copiar ID',
					onClick() {
						toast.promise(copyId(user.id), {
							success: 'ID copiado al portapapeles',
						});
					},
				},
				{
					id: 3,
					className: 'text-red-600 focus:text-red-600',
					children: (
						<>
							<Trash className="mr-2 h-4 w-4" />
							Eliminar
						</>
					),
				},
			]}
		/>
	);
}
