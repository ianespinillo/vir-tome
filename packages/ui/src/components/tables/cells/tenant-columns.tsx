// src/app/super-admin/dashboard/components/columns.tsx
'use client';

import { GenericActions } from '@/components/dropdown/generic-actions';
import { copyId } from '@/helpers/clipboard-helper';
import { Badge } from '@/ui/badge';
import { ITenant } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export const Tenantcolumns: ColumnDef<ITenant>[] = [
	{
		accessorKey: 'name',
		header: 'Cliente',
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium text-sm">{row.getValue('name')}</span>
				<span className="text-xs text-muted-foreground">
					{row.original.subdomain}
				</span>
			</div>
		),
	},
	{
		accessorKey: 'is_active',
		header: 'Estado',
		cell: ({ row }) => {
			const status: boolean = row.getValue('is_active');

			const variant = status === true ? 'default' : 'destructive';

			return (
				<Badge variant={variant} className="capitalize text-[10px] h-5 px-1.5">
					{status ? 'Activo' : 'Baja'}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header: 'Alta',
		cell: ({ row }) => (
			<div className="text-muted-foreground text-xs">
				{new Date(row.getValue('created_at')).toLocaleDateString()}
			</div>
		),
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return (
				<GenericActions
					nodes={[
						{
							id: 1,
							children: 'Copiar ID',
							onClick() {
								toast.promise(copyId(row.original.id), {
									success: 'ID copiado al portapapeles',
								});
							},
						},
					]}
				/>
			);
		},
	},
];
