import { booksContext } from '@/contexts/book.context';
import { ColumnDef } from '@tanstack/react-table';
import React, { useContext } from 'react';
import { bookColumns } from '../cells/books-columns';
import { GenericTable } from './generic-table';

export const BooksTable = () => {
	const { data, isLoading, fetchNextPage, fetchPreviousPage } =
		useContext(booksContext);
	return (
		<div className="p-5">
			<GenericTable
				columns={bookColumns as ColumnDef<unknown>[]}
				data={data?.data ?? []}
				isLoading={isLoading}
				fetchNextPage={fetchNextPage}
				fetchPreviousPage={fetchPreviousPage}
				currentPage={data?.current_page ?? 0}
				totalPages={data?.last_page ?? 0}
				isFetching={isLoading}
			/>
		</div>
	);
};
