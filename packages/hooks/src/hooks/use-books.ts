// Hook useBooks actualizado para recibir searchTerm
import {
	BooksQueriesDto,
	CreateBookDto,
	GenericHookProps,
	IBooKForm,
	UpdateBookDto,
} from '@repo/common';
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BookService } from '../services/book.service';

export const useBooks = (queries: BooksQueriesDto) => {
	const client = useQueryClient();

	const books = useQuery({
		queryKey: ['books', queries],
		queryFn: async () => (await BookService.getBooks(queries)).data,
		placeholderData: keepPreviousData,
		staleTime: 5000,
		refetchOnWindowFocus: false,
	});

	const createBook = useMutation({
		mutationFn: async (data: CreateBookDto) =>
			(await BookService.createBook(data)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books', queries] });
		},
	});

	const findBook = useMutation({
		mutationFn: async (id: string | number) =>
			(await BookService.getBookById(id)).data,
	});

	const updateBook = useMutation({
		mutationFn: async (data: UpdateBookDto) =>
			(await BookService.updateBook(data.id, data)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books', queries] });
		},
	});

	const deleteBook = useMutation({
		mutationFn: async (id: string | number) =>
			(await BookService.deleteBook(id)).data,
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books', queries] });
		},
	});

	return {
		books,
		createBook,
		findBook,
		updateBook,
		deleteBook,
	};
};

export const useFullBooks = () =>
	useQuery({
		queryKey: ['fullBooks'],
		queryFn: async () => (await BookService.getAllBooks()).data,
	});
