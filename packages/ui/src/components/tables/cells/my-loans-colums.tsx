import {
	ActionNode,
	GenericActions,
} from '@/components/dropdown/generic-actions';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { BaseQueriesDto, ILoan } from '@repo/common';
import { useMyLoans } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertTriangle, ArrowUpDown, Check, Clock, X } from 'lucide-react';

export const MyLoansColumns: ColumnDef<ILoan>[] = [
	{
		accessorKey: 'book',
		header: 'Libro prestado',
		cell: ({ row }) => row.original.book?.title || 'N/A',
	},
	{
		accessorKey: 'loan_date',
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				className="flex items-center gap-2"
			>
				Fecha préstamo
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ getValue }) => {
			const dateString = getValue() as string;
			if (!dateString) return 'No registrada';
			return (
				<span className="text-center">
					{dateString.split('-').reverse().join('/')}
				</span>
			);
		},
	},
	{
		accessorKey: 'return_date',
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				className="flex items-center gap-2"
			>
				Fecha devolución
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ getValue }) => {
			const dateString = getValue() as string;
			if (!dateString) return 'Pendiente';
			return format(new Date(dateString.replace(' ', 'T')), 'dd/MM/yyyy HH:mm');
		},
	},
	{
		accessorKey: 'status',
		header: 'Estado',
		cell: ({ row }) => {
			const status = row.original.status;
			const icon = {
				ACTIVE: <Clock className="h-4 w-4 text-blue-500" />,
				RETURNED: <Check className="h-4 w-4 text-green-500" />,
				OVERDUE: <AlertTriangle className="h-4 w-4 text-red-500" />,
				DENIED: <X className="h-4 w-4 text-gray-700" />,
				REQUESTED: <Clock className="w-4 h-4 text-yellow-500" />,
			}[status];

			return (
				<div className="flex items-center gap-2">
					{icon}
					<span>
						{
							{
								ACTIVE: 'Activo',
								RETURNED: 'Devuelto',
								OVERDUE: 'Vencido',
								REQUESTED: 'Solicitado',
								DENIED: 'Rechazado',
							}[status]
						}
					</span>
				</div>
			);
		},
	},
	{
		id: 'actions',
		header: 'Acciones',
		cell({ row }) {
			const loan = row.original;
			const { setDetailsOpen, setEntity, setCreateOpen } = useModalCrud<
				ILoan,
				BaseQueriesDto<ILoan>,
				ReturnType<typeof useMyLoans>
			>();
			const nodes: ActionNode[] = [
				{
					id: 1,
					children: 'Ver detalles',
					onClick() {
						setEntity(loan);
						setDetailsOpen(true);
					},
				},
				{
					id: 1,
					children: 'Crear una copia',
					onClick() {
						setEntity(loan);
						setCreateOpen(true);
					},
				},
			];
			return <GenericActions nodes={nodes} />;
		},
	},
];
