import { ILoan, LoanBorrowerType } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const LastLoansColumns: ColumnDef<ILoan>[] = [
	{
		accessorKey: 'id',
		header: 'ID',
	},
	{
		accessorFn: (row) => row.book,
		accessorKey: 'title',
		header: 'Libro',
		cell: ({ row }) => row.original.book.title,
	},
	{
		accessorFn: (row) => row.user,
		accessorKey: 'email',
		header: 'Email de usuario',
		cell: ({ row }) =>
			row.original.borrower_type === LoanBorrowerType.REGISTERED_USER
				? row.original.user?.email
				: row.original.borrower_email,
	},
	{
		accessorKey: 'return_date',
		header: 'Estado',
		cell: ({ row }) => {
			const { return_date } = row.original;
			const date = new Date(return_date);
			const today = new Date();
			const isOverdue = date < today;
			return (
				<span
					className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-green-500'}`}
				>
					{isOverdue ? 'Vencido' : 'Devuelto'}
				</span>
			);
		},
	},
];
