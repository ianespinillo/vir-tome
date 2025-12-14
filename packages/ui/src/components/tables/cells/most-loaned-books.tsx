import { MostLoanedBooks } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';

export const MostLoanedBooksColumns: ColumnDef<MostLoanedBooks>[] = [
	{
		accessorKey: 'id',
		header: 'Codigo',
	},
	{
		accessorKey: 'title',
		header: 'Titulo',
	},
	{
		accessorKey: 'count',
		header: 'Cantidad',
	},
];
