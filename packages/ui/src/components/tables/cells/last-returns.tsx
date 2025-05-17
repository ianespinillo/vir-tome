import { LastReturns } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const LastReturnsColumns: ColumnDef<LastReturns>[] = [
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
		header: 'Fecha devolución',
		cell: ({ row }) => {
			const { returnDate } = row.original;
			const date = new Date(returnDate);
			return (
				<span className="text-sm font-medium text-gray-900">
					{date.toLocaleDateString()}
				</span>
			);
		},
	},
];
