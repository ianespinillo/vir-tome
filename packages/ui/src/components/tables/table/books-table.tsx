import { useModalCrud } from '@/contexts/modal-crud-context';
import { BooksQueriesDto, IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import React from 'react';
import { bookColumns } from '../cells/books-columns';
import { PaginableTable } from './paginable-table';

export const BooksTable = () => {
	const {
		hook: { books },
	} = useModalCrud<IBook, BooksQueriesDto, ReturnType<typeof useBooks>>();
	return (
		<div className="p-5">
			<PaginableTable columns={bookColumns} query={books} />
		</div>
	);
};
