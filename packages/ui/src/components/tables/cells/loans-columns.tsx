import { SeeLoan } from '@/components/dialogs/see-loan';
import { FinalizeLoanPopover } from '@/components/popovers/finalize-loan';
import { Button } from '@/ui/button';
import { ILoanResponse } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { AlertTriangle, ArrowUpDown, Check, Clock, Eye } from 'lucide-react';

export const loanColumn: ColumnDef<ILoanResponse>[] = [
	{
		accessorKey: 'id',
		header: 'ID',
	},
	{
		accessorKey: 'borrowerName',
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				className="flex items-center gap-2"
			>
				Docente
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
	},
	{
		accessorKey: 'book',
		header: 'Libro prestado',
		cell: ({ row }) => row.original.book || 'N/A',
	},
	{
		accessorKey: 'loanDate',
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
			return format(new Date(dateString.replace(' ', 'T')), 'dd/MM/yyyy HH:mm');
		},
	},
	{
		accessorKey: 'returnDate',
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
				ACTIVE: <Clock className="h-4 w-4 text-yellow-500" />,
				RETURNED: <Check className="h-4 w-4 text-green-500" />,
				OVERDUE: <AlertTriangle className="h-4 w-4 text-red-500" />,
			}[status];

			return (
				<div className="flex items-center gap-2">
					{icon}
					<span>
						{status === 'ACTIVE'
							? 'Pendiente'
							: status === 'RETURNED'
								? 'Devuelto'
								: 'Vencido'}
					</span>
				</div>
			);
		},
	},
	{
		id: 'actions',
		header: 'Acciones',
		cell: ({ row }) => {
			const loan = row.original;

			return (
				<div className="flex items-center gap-2">
					<SeeLoan loan={loan} />
					{loan.status === 'ACTIVE' && <FinalizeLoanPopover loanId={loan.id} />}
				</div>
			);
		},
	},
];
