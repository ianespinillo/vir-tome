import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import React, { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';

import { Button } from '@/ui/button';

// components/GenericTable.tsx
interface GenericTableProps<T> {
	data: T[];
	isLoading: boolean;
	isFetching?: boolean;
	columns: ColumnDef<T>[];
	currentPage: number;
	totalPages: number;
	fetchNextPage?: () => void;
	fetchPreviousPage?: () => void;
	paginable?: boolean;
}

export const GenericTable = <T,>({
	data,
	isLoading = false,
	isFetching = false,
	columns = [],
	currentPage,
	totalPages,
	fetchNextPage,
	fetchPreviousPage,
	paginable = false,
}: Readonly<GenericTableProps<T>>) => {
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable<T>({
		data,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	console.log(data);
	return (
		<div className="rounded-md border">
			<Table>
				{/* Cabecera de la tabla */}
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id}>
									{flexRender(header.column.columnDef.header, header.getContext())}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>

				{/* Cuerpo de la tabla */}
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								Cargando...
							</TableCell>
						</TableRow>
					) : table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								No hay resultados
							</TableCell>
						</TableRow>
					)}
				</TableBody>

				{/* Pie de tabla con controles de paginación */}
				<TableFooter className={paginable ? '' : 'hidden'}>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="flex items-center justify-between">
								<Button
									onClick={fetchPreviousPage}
									disabled={currentPage <= 1 || isFetching}
								>
									Anterior
								</Button>

								<div className="flex items-center gap-2">
									<span>
										Página {currentPage} de {totalPages}
									</span>
								</div>

								<Button
									onClick={fetchNextPage}
									disabled={currentPage >= totalPages || isFetching}
								>
									Siguiente
								</Button>
							</div>
						</TableCell>
					</TableRow>
				</TableFooter>
			</Table>
		</div>
	);
};
