// src/app/super-admin/dashboard/components/columns.tsx
'use client';

import { Badge } from '@/ui/badge'; // Ajusta según tu estructura de imports
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { ITenant } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

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
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-6 w-6 p-0">
							<span className="sr-only">Menú</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Acciones</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(row.original.id.toLocaleString())
							}
						>
							Copiar ID
						</DropdownMenuItem>
						<DropdownMenuItem>Ver detalles</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
