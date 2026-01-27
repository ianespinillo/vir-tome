'use client';
import { BooksQueriesDto, IBook } from '@repo/common';
import { useBooks } from '@repo/hooks';
import {
	AddBook,
	AddButton,
	BookDetailDialog,
	BooksTable,
	EditBook,
	InputFilter,
	ModalCrudProvider,
	useModalCrud,
} from '@repo/ui';
import React, { useEffect, useState } from 'react';
export default function BooksPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient ? (
		<ModalCrudProvider<ReturnType<typeof useBooks>, IBook, BooksQueriesDto>
			useHook={useBooks}
			queries={new BooksQueriesDto()}
		>
			<div className="px-8 pt-3">
				<h1 className="text-5xl font-bold text-primary">Libros</h1>
				<span className="text-muted-foreground text-xl">
					Estos son los libros disponibles
				</span>
			</div>

			<div className="px-5 flex justify-end gap-x-4">
				<InputFilter text="Buscar libro..." />
				<Button />
			</div>
			<div className="p-5">
				<BooksTable />
			</div>
			<AddBook />
			<EditBook />
			<BookDetailDialog />
		</ModalCrudProvider>
	) : null;
}

function Button() {
	const { setCreateOpen } = useModalCrud();
	return <AddButton action={() => setCreateOpen(true)} text="Agregar libro" />;
}
