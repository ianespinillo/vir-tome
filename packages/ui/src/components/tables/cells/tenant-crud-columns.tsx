// src/app/super-admin/tenants/components/columns.tsx
'use client';

import { EditTenantDialog } from '@/components/dialogs/edit-tenant-dialog';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Checkbox } from '@/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { ITenant } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';
import {
	ArrowUpDown,
	LogIn,
	MoreHorizontal,
	Pencil,
	Trash,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTenants } from '../../../../../hooks/src/hooks/use-tenant';

export const tenantCrudColumns: ColumnDef<ITenant>[] = [
	// 2. Nombre con ORDENAMIENTO (Sorting)
	{
		accessorKey: 'name',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Cliente
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
	},

	// ... Otras columnas (Plan, Dueño, etc.) ...
	{
		accessorKey: 'plan',
		header: 'Plan',
		cell: ({ row }) => <div className="font-medium">{row.getValue('plan')}</div>,
	},
	{
		accessorKey: 'contact_email',
		header: 'Email de contacto',
		cell: ({ row }) => (
			<div className="font-medium">{row.getValue('contact_email')}</div>
		),
	},
	{
		accessorKey: 'created_at',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Fecha de alta
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="font-medium">
				{new Date(row.getValue('created_at')).toLocaleDateString()}
			</div>
		),
	},
	// 3. Status (Más grande o con más info que en el dashboard)
	{
		accessorKey: 'is_active',
		header: 'Estado',
		cell: ({ row }) => (
			<Badge variant={row.original.is_active ? 'default' : 'destructive'}>
				{row.original.is_active ? 'Activo' : 'Inactivo'}
			</Badge>
		),
	},

	// 4. ACCIONES (Aquí ocurre la magia del CRUD)
	{
		id: 'actions',
		cell: ({ row }) => <TenantActions tenant={row.original} />,
		// Renderizamos un componente React real para poder usar hooks dentro de él
	},
];

function TenantActions({ tenant }: Readonly<{ tenant: ITenant }>) {
	const {
		setEntity,
		setEditOpen,
		setDetailsOpen,
		hook: { deleteTenant },
	} = useModalCrud<ITenant, ReturnType<typeof useTenants>>();

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
						setEntity(tenant);
						setDetailsOpen(true);
					}}
				>
					Ver detalles
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => navigator.clipboard.writeText(tenant.id.toString())}
				>
					Copiar ID
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => {
						setEntity(tenant);
						setEditOpen(true);
					}}
				>
					<Pencil className="mr-2 h-4 w-4" />
					Editar
				</DropdownMenuItem>

				{/* Acción especial de SuperAdmin: Loguearse como este tenant */}
				<DropdownMenuItem onClick={() => console.log('Impersonate', tenant.id)}>
					<LogIn className="mr-2 h-4 w-4" /> Acceder al panel
				</DropdownMenuItem>

				<DropdownMenuItem
					className="text-red-600 focus:text-red-600"
					onClick={() => {
						toast.promise(deleteTenant.mutateAsync(tenant.id), {
							success: 'Tenant eliminado satisfactoriamente',
							error: 'Error al eliminar tenant',
						});
					}}
				>
					<Trash className="mr-2 h-4 w-4" /> Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
