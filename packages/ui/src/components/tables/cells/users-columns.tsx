'use client';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { IUser } from '@repo/common';
import { useUsers } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import {
	ArrowUpDown,
	LogIn,
	MoreHorizontal,
	Pencil,
	Trash,
} from 'lucide-react';
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
		cell: ({ row }) => <UserActions user={row.original} />,
	},
];

function UserActions({ user }: { user: IUser }) {
	const { setEntity, setEditOpen, setDetailsOpen } = useModalCrud<
		IUser,
		ReturnType<typeof useUsers>
	>();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="h-8 w-8 p-0">
					<span className="sr-only">Abrir menú</span>
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Acciones</DropdownMenuLabel>

				<DropdownMenuItem
					onClick={() => {
						setEntity(user);
						setDetailsOpen(true);
					}}
				>
					Ver detalles
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => {
						navigator.clipboard.writeText(user.id.toString());
						toast.info('ID copiado al portapapeles');
					}}
				>
					Copiar ID
				</DropdownMenuItem>

				<DropdownMenuItem
					className="text-red-600 focus:text-red-600"
					/* onClick={() => {
            toast.promise(deleteTenant.mutateAsync(tenant.id),{
              success: 'Tenant eliminado satisfactoriamente',
              error: 'Error al eliminar tenant'
            })
          }} */
				>
					<Trash className="mr-2 h-4 w-4" /> Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
