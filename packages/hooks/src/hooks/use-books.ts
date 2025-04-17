import { CreateBookDto, IBooKForm, IBook, UpdateBookDto } from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useBooks = () => {
	const client = useQueryClient();
	const [page, setPage] = useState(1);
	const books = useQuery({
		queryKey: ['books', page],
		queryFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/book?page=${page}`).then((res) =>
				res.json(),
			),
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
	const createBook = useMutation({
		mutationFn: async (data: CreateBookDto) => {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/book`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error(response.statusText);
			return response.json() as Promise<IBook>;
		},
		onSuccess: () => {
			client.refetchQueries();
		},
	});
	const findBook = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${id}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return response.json() as Promise<IBooKForm>;
		},
	});
	const updateBook = useMutation({
		mutationFn: async (data: UpdateBookDto) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${data.id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify(data),
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return response.json() as Promise<IBook>;
		},
		onSuccess: () => {
			client.refetchQueries();
		},
	});
	const deleteBook = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/book/${id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			if (!response.ok) throw new Error(response.statusText);
			return await response.json();
		},
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
	};
};
