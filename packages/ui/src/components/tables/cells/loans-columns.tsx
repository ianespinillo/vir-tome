import { SeeLoan } from '@/components/dialogs/see-loan';
import {
	ActionNode,
	GenericActions,
} from '@/components/dropdown/generic-actions';
import { FinalizeLoanPopover } from '@/components/popovers/finalize-loan';
import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { ILoan, LoanStatus } from '@repo/common';
import { useLoans } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
	AlertTriangle,
	ArrowUpDown,
	Check,
	Clock,
	Eye,
	EyeIcon,
} from 'lucide-react';

export const loanColumn: ColumnDef<ILoan>[] = [
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
			const { setEntity, setDetailsOpen } = useModalCrud<
				ILoan,
				ReturnType<typeof useLoans>
			>();
			const nodes: ActionNode[] = [
				{
					id: 1,
					children: (
						<>
							<EyeIcon className="h-2 w-2 mr-2" />
							Ver detalle
						</>
					),
					className: 'cursor-pointer',
					onClick() {
						setEntity(loan);
						setDetailsOpen(true);
					},
				},
			];
			if (loan.status === LoanStatus.ACTIVE) {
				nodes.push({
					id: 2,
					children: <FinalizeLoanPopover loanId={loan.id} />,
				});
			}
			return <GenericActions nodes={nodes} />;
		},
	},
];
