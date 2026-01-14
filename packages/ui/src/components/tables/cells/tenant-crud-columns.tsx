// src/app/super-admin/tenants/components/columns.tsx
'use client';

import { LinkTenantDialog } from '@/components/dialogs/tenants/link-tenant-dialog';
import { GenericActions } from '@/components/dropdown/generic-actions';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { copyId } from '@/helpers/clipboard-helper';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import { ITenant, ROLES } from '@repo/common';
import { useTenants } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import {
	ArrowUpDown,
	LogIn,
	MoreHorizontal,
	Pencil,
	Trash,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
	const [linkOpen, setLinkOpen] = useState(false);
	return (
		<>
			<GenericActions
				nodes={[
					{
						id: 1,
						children: 'Ver detalles',
						onClick: () => {
							setEntity(tenant);
							setDetailsOpen(true);
						},
					},
					{
						id: 2,
						children: 'Copiar ID',
						onClick: () => {
							toast.promise(copyId(tenant.id), {
								success: 'ID copiado al portapapeles',
							});
						},
					},
					{
						id: 3,
						children: (
							<>
								<Pencil className="mr-2 h-4 w-4" />
								Editar
							</>
						),
						onClick: () => {
							setEntity(tenant);
							setEditOpen(true);
						},
					},
					{
						id: 4,
						children: 'Vincular usuario existente',
						onClick: () => setLinkOpen(true),
					},
					{
						id: 5,
						children: (
							<>
								<LogIn className="mr-2 h-4 w-4" />
								Acceder al panel
							</>
						),
						onClick: () => console.log('Impersonate', tenant.id),
					},
					{
						id: 6,
						children: (
							<>
								<Trash className="mr-2 h-4 w-4" />
								Eliminar
							</>
						),
						className: 'text-red-600 focus:text-red-600',
						onClick: () => {
							toast.promise(deleteTenant.mutateAsync(tenant.id), {
								success: 'Tenant eliminado satisfactoriamente',
								error: 'Error al eliminar tenant',
							});
						},
					},
				]}
			/>
			<LinkTenantDialog
				tenantId={tenant.id}
				availableRoles={Object.values(ROLES).filter(
					(role) => role !== ROLES.SUPER_ADMIN,
				)}
				open={linkOpen}
				onOpenChange={setLinkOpen}
			/>
		</>
	);
}
