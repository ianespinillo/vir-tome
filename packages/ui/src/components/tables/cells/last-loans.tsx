import { LastLoans } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const LastLoansColumns: ColumnDef<LastLoans>[] = [
	{
		accessorKey: 'id',
		header: 'ID',
	},
	{
		accessorKey: 'title',
		header: 'Libro',
	},
	{
		accessorKey: 'returnDate',
		header: 'Estado',
		cell: ({ row }) => {
			const { returnDate } = row.original;
			const date = new Date(returnDate);
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
