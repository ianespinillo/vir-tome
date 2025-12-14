'use client';
import { AddBook, BooksTable, InputFilter } from '@repo/ui';
import React, { useEffect, useState } from 'react';

export default function BooksPage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient ? (
		<div>
			<div className="px-8 pt-3">
				<h1 className="text-5xl font-bold text-primary">Libros</h1>
				<span className="text-muted-foreground text-xl">
					Estos son los libros disponibles
				</span>
			</div>

			<div className="px-5 flex justify-end gap-x-4">
				<InputFilter text="Buscar libro..." />
				<AddBook />
			</div>
			{/* <BooksTable /> */}
		</div>
	) : null;
}
