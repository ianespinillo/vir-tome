import { CreateLoanDto, ILoanResponse, IPaginatedResponse } from '@repo/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useLoans = () => {
	const [page, setPage] = useState(1);
	const client = useQueryClient();
	const loans = useQuery<IPaginatedResponse<ILoanResponse>>({
		queryKey: ['loans', page],
		queryFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan?page=${page}`).then((res) =>
				res.json(),
			),
		staleTime: 5000,
		refetchOnWindowFocus: false,
	});
	const createLoan = useMutation({
		mutationFn: async (data: CreateLoanDto) => {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/loan`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(data),
			});
			return response.json();
		},
		onSuccess: () => {
			client.refetchQueries();
		},
	});
	const finishLoan = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/loan/return/${id}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			return response.json();
		},
		onSuccess: () => {
			client.refetchQueries();
		},
	});
	const findLoan = useMutation({
		mutationFn: async (id: string | number) => {
			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/loan/${id}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				},
			);
			return response.json();
		},
	});
	return {
		loans,
		createLoan,
		finishLoan,
		findLoan,
	};
};
