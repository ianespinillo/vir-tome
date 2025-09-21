// BookProvider actualizado
import type { IBookContext } from '@repo/common';
import { useBooks, useDebounceValue } from '@repo/hooks';
import { createContext, useMemo, useState } from 'react';

export const booksContext = createContext({} as IBookContext);

export const BookProvider = ({
	children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element => {
	// Estado local para el término de búsqueda
	const [searchTerm, setSearchTerm] = useState<string>('');

	// Debounce del término de búsqueda
	const debouncedSearchTerm = useDebounceValue(searchTerm, 750);

	// Hook de libros que ahora recibe el término de búsqueda
	const { books, createBook, deleteBook, updateBook, findBook } =
		useBooks(debouncedSearchTerm);

	// Memorizar el valor del contexto
	const value = useMemo(
		() => ({
			// Datos de libros
			data: books.data,
			page: books.page,
			setPage: books.setPage,
			fetchNextPage: books.fetchNextPage,
			fetchPreviousPage: books.fetchPreviousPage,
			isLoading: books.isLoading,
			refetch: books.refetch,

			// Funciones CRUD
			deleteBook,
			createBook,
			updateBook,
			findBook,

			// Estado de búsqueda
			searchTerm,
			setSearchTerm,
			debouncedSearchTerm, // Por si lo necesitas en algún componente
		}),
		[
			books.data,
			books.page,
			books.setPage,
			books.fetchNextPage,
			books.fetchPreviousPage,
			books.refetch,
			books.isLoading,
			deleteBook,
			findBook,
			createBook,
			updateBook,
			searchTerm,
			debouncedSearchTerm,
		],
	);

	return <booksContext.Provider value={value}>{children}</booksContext.Provider>;
};
