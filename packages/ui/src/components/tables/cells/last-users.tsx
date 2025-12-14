import { IUser } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const LastUsers: ColumnDef<IUser>[] = [
	{
		accessorKey: 'name',
		header: 'Nombre',
	},
	{
		accessorKey: 'email',
		header: 'Email',
	},
	{
		accessorKey: 'created_at',
		header: 'Creado',
		cell: ({ row }) => new Date(row.getValue('created_at')).toLocaleDateString(),
	},
];
