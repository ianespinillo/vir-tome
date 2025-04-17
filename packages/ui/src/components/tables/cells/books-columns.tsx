import { DeleteBook } from '@/components/dialogs/delete-book';
import { EditBook } from '@/components/dialogs/edit-book';
import { Button } from '@/ui/button';
import { IBookResponse } from '@repo/common';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react'; // Replace '@/ui/icons' with the correct module path for ArrowUpDown

export const bookColumns: ColumnDef<IBookResponse>[] = [
	{
		accessorKey: 'id',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'title',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Titulo
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	/* {
    accessorKey: 'publisher',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2"
        >
          Author
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'categories',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-2"
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  }, */
	{
		accessorKey: 'availableQuantity',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Cantidad disponible
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'publicationYear',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					className="flex items-center gap-2"
				>
					Año de publicación
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: 'Actions',
		header: 'Acciones',
		cell: ({ row }) => {
			return (
				<div className="flex gap-2 justify-start">
					<EditBook id={row.original.id} />
					<DeleteBook id={row.original.id} title={row.original.title} />
				</div>
			);
		},
	},
];
