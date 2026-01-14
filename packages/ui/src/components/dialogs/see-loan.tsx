import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { ILoan } from '@repo/common';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

export function SeeLoan({
	loan,
}: Readonly<{
	loan: ILoan | null;
}>) {
	if (!loan) return null;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="hover:bg-gray-100">
					<Eye className="h-4 w-4" />
					<span className="sr-only">Ver detalles</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Detalles del Préstamo</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="text-sm font-medium text-gray-500">Docente</h4>
							<p>{loan.user.email}</p>
						</div>
						<div>
							<h4 className="text-sm font-medium text-gray-500">Libro</h4>
							<p>{loan.book.title || 'N/A'}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<h4 className="text-sm font-medium text-gray-500">Fecha Préstamo</h4>
							<p>
								{loan.loan_date
									? format(
											new Date(String(loan.loan_date).replace(' ', 'T')),
											'dd/MM/yyyy HH:mm',
										)
									: 'No registrada'}
							</p>
						</div>
						<div>
							<h4 className="text-sm font-medium text-gray-500">Fecha Devolución</h4>
							<p>
								{loan.return_date
									? format(
											new Date(loan.return_date.toString().replace(' ', 'T')),
											'dd/MM/yyyy HH:mm',
										)
									: 'Pendiente'}
							</p>
						</div>
					</div>

					<div>
						<h4 className="text-sm font-medium text-gray-500">Estado</h4>
						<p className="capitalize">
							{loan.status === 'ACTIVE'
								? 'Pendiente'
								: loan.status === 'RETURNED'
									? 'Devuelto'
									: 'Vencido'}
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
