import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { ILoan, LoanStatus } from '@repo/common';
import { useLoansRequest } from '@repo/hooks';
import { ColumnDef } from '@tanstack/react-table';
import { Check, Info, X } from 'lucide-react';
import { toast } from 'sonner';

export const requestColumns: ColumnDef<ILoan>[] = [
	{
		accessorKey: 'user',
		cell: ({ row }) => row.original.user?.email,
		header: 'Prestatario solicitante',
	},
	{
		accessorKey: 'book',
		header: 'Libro solicitado',
		cell: ({ row }) => row.original.book.title,
	},
	{
		accessorKey: 'quantity',
		header: 'Cantidad solicitada',
	},
	{
		id: 'Acciones',
		cell: ({ row }) => {
			const loan = row.original;
			const {
				setEntity,
				setDetailsOpen,
				hook: { updateLoanStatus },
			} = useModalCrud<ILoan, ReturnType<typeof useLoansRequest>>();
			return (
				<div className="flex gap-2 justify-center">
					<Button
						variant="outline"
						size="icon"
						className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
						onClick={() => {
							toast.promise(
								updateLoanStatus.mutateAsync({
									loanId: loan.id,
									status: LoanStatus.ACTIVE,
								}),
								{
									success: 'Solicitud aceptada exitosamente',
									error: 'Error procesando la solicitud',
								},
							);
						}}
					>
						<Check className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
						onClick={() => {
							toast.promise(
								updateLoanStatus.mutateAsync({
									loanId: loan.id,
									status: LoanStatus.DENIED,
								}),
								{
									success: 'Solicitud denegada exitosamente',
									error: 'Error procesando la solicitud',
								},
							);
						}}
					>
						<X className="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
						onClick={() => {
							setEntity(loan);
							setDetailsOpen(true);
						}}
					>
						<Info className="w-4 h-4" />
					</Button>
				</div>
			);
		},
	},
];
