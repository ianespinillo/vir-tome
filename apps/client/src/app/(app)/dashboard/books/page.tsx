'use client';
import { AddBook, BookProvider, BooksTable } from '@repo/ui';
import React, { useEffect, useState } from 'react';

export default function BooksPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient ? (
		<BookProvider>
			<div>
				<div className="px-8 py-5">
					<h1 className="text-5xl font-bold text-primary">Libros</h1>
					<span className="text-muted-foreground text-xl">
						Estos son los libros disponibles
					</span>
				</div>
				<div className="px-5 flex justify-end">
					<AddBook />
				</div>
				<BooksTable />
			</div>
		</BookProvider>
	) : null;
}
