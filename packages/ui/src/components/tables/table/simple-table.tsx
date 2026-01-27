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
	data: T[];
	columns: ColumnDef<T>[];
	isLoading?: boolean;
}

export const SimpleTable = <T,>({
	data,
	columns,
	isLoading = false,
}: Readonly<SimpleTableProps<T>>) => {
	const table = useReactTable({
		columns,
		data,
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
					{isLoading ? (
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
