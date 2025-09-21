// Hook useBooks actualizado para recibir searchTerm
import { CreateBookDto, IBook, UpdateBookDto } from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export const useBooks = (searchTerm?: string) => {
	const client = useQueryClient();
	const [page, setPage] = useState(1);

	const books = useQuery({
		queryKey: ['books', page, searchTerm],
		queryFn: () => {
			let url = `${process.env.NEXT_PUBLIC_API_URL}/book?page=${page}`;

			// Si hay término de búsqueda, agregarlo a la URL
			if (searchTerm?.trim()) {
				url += `&search=${encodeURIComponent(searchTerm.trim())}`;
			}

			return fetch(url).then((res) => res.json());
		},
		staleTime: 5000,
		refetchOnWindowFocus: false,
	});

	const fetchNextPage = async () => {
		if (books.data && books.data.current_page < books.data.last_page) {
			setPage((prev) => prev + 1);
		}
	};

	const fetchPreviousPage = async () => {
		if (books.data && books.data.current_page > 1) {
			setPage((prev) => Math.max(prev - 1, 1));
		}
	};

	// Reiniciar página cuando cambie el término de búsqueda
	useEffect(() => {
		setPage(1);
	}, [searchTerm]);

	const createBook = useMutation({
		mutationFn: async (data: CreateBookDto) => {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/book`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error(response.statusText);
			return response.json() as Promise<IBook>;
		},
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books'] });
		},
	});

	const findBook = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${id}`,
				{
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return response.json();
		},
	});

	const updateBook = useMutation({
		mutationFn: async (data: UpdateBookDto) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${data.id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return response.json() as Promise<IBook>;
		},
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books'] });
		},
	});

	const deleteBook = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${id}`,
				{
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return await response.json();
		},
		onSuccess: () => {
			client.refetchQueries({ queryKey: ['books'] });
		},
	});
	const fullBooks = useMutation({
		mutationKey: ['fullBooks'],
		mutationFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/book?full=true`).then((res) =>
				res.json(),
			),
	});

	return {
		books: {
			...books,
			fetchNextPage,
			fetchPreviousPage,
			page,
			setPage,
		},
		createBook,
		findBook,
		updateBook,
		deleteBook,
		fullBooks,
	};
};
