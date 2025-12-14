import { Skeleton } from '@/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/ui/table';
import { IApiResponse, UseQueryResult } from '@repo/common';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import React from 'react';

interface SimpleTableProps<T> {
	query: UseQueryResult<IApiResponse<T[]>, IApiResponse<Error>>;
	columns: ColumnDef<T>[];
}

export const SimpleTable = <T,>({
	query,
	columns,
}: Readonly<SimpleTableProps<T>>) => {
	const rows = query.data?.data;
	const table = useReactTable({
		columns,
		data: rows ?? [],
		getCoreRowModel: getCoreRowModel(),
	});
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
					{query.isLoading ? (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								<Skeleton className="w-full" />
							</TableCell>
						</TableRow>
					) : (
						(() => {
							if (table.getRowModel().rows?.length) {
								return table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								));
							}
							return (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No hay resultados
									</TableCell>
								</TableRow>
							);
						})()
					)}
				</TableBody>
			</Table>
		</div>
	);
};
