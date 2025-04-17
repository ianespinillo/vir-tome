import type { IBookContext } from '@repo/common';
import { useBooks } from '@repo/hooks';
import { createContext, useMemo } from 'react';

export const booksContext = createContext({} as IBookContext);

export const BookProvider = ({
	children,
}: Readonly<{ children: React.ReactNode }>): JSX.Element => {
	const { books, createBook, deleteBook, updateBook, findBook } = useBooks();

	// Memorizar el valor del contexto
	const value = useMemo(
		() => ({
			data: books.data,
			page: books.page,
			setPage: books.setPage,
			fetchNextPage: books.fetchNextPage,
			fetchPreviousPage: books.fetchPreviousPage,
			deleteBook,
			createBook,
			updateBook,
			findBook,
			isLoading: books.isLoading,
			refetch: books.refetch,
		}),
		[
			books.data,
			books.page,
			books.setPage,
			books.fetchNextPage,
			books.fetchPreviousPage,
			books.refetch,
			deleteBook,
			findBook,
			createBook,
			updateBook,
			books.isLoading,
		],
	);

	return <booksContext.Provider value={value}>{children}</booksContext.Provider>;
};
