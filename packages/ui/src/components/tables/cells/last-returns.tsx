import { ILoan, LastReturns } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const LastReturnsColumns: ColumnDef<ILoan>[] = [
	{
		accessorKey: 'id',
		header: 'ID',
	},
	{
		accessorFn: (row) => row.book,
		accessorKey: 'book',
		header: 'Libro',
		cell: ({ row }) => row.original.book.title,
	},
	{
		accessorKey: 'return_date',
		header: 'Fecha devolución',
		cell: ({ row }) => {
			const { return_date } = row.original;
			const date = new Date(return_date);
			return (
				<span className="text-sm font-medium text-gray-900">
					{date.toLocaleDateString()}
				</span>
			);
		},
	},
];
