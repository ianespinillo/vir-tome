'use client';
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

import { useModalCrud } from '@/contexts/modal-crud-context';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import { IApiResponse, IPaginatedResponse, UseQueryResult } from '@repo/common';
// components/GenericTable.tsx
interface PaginableTableProps<T> {
	query: UseQueryResult<IApiResponse<IPaginatedResponse<T>>>;
	columns: ColumnDef<T>[];
}

// recibo el usequery y handleo la page
export const PaginableTable = <T,>({
	query,
	columns,
}: Readonly<PaginableTableProps<T>>) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const paginatedData = query.data?.data as IPaginatedResponse<T>;
	const { setQueryParams } = useModalCrud();

	const table = useReactTable<T>({
		data: paginatedData?.items,
		manualPagination: true,
		pageCount: paginatedData?.meta.last_page,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
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
				<TableFooter>
					<TableRow>
						<TableCell colSpan={columns.length}>
							<div className="flex items-center justify-between">
								<Button
									onClick={() =>
										setQueryParams((prev) => ({
											...prev,
											page: Math.max(paginatedData?.meta.current_page - 1, 1),
										}))
									}
									disabled={paginatedData?.meta.current_page <= 1 || query.isFetching}
								>
									Anterior
								</Button>

								<div className="flex items-center gap-2">
									<span>
										Página {paginatedData?.meta.current_page} de{' '}
										{paginatedData?.meta.last_page}
									</span>
								</div>

								<Button
									onClick={() =>
										setQueryParams((prev) => ({
											...prev,
											page: Math.min(
												paginatedData?.meta.current_page + 1,
												paginatedData?.meta.last_page,
											),
										}))
									}
									disabled={
										paginatedData?.meta.current_page >= paginatedData?.meta.last_page ||
										query.isFetching
									}
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
