import { useMutation, useQuery } from '@tanstack/react-query';

export const useAnalytics = () => {
	const mostLoanedBooks = useMutation({
		mutationKey: ['most-loaned-books'],
		mutationFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/most-loaned-books`).then(
				(res) => res.json(),
			),
	});
	const lastLoans = useQuery({
		queryKey: ['last-loans'],
		queryFn: () =>
			fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/last-loans`).then(
				(res) => res.json(),
			),
		refetchOnWindowFocus: false,
	});
	const lastReturns = useQuery({
		queryKey: ['last-returns'],
		queryFn: () => {
			return fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/analytics/last-returns`,
			).then((res) => res.json());
		},
		refetchOnWindowFocus: false,
	});

	const countBooks = useMutation({
		mutationKey: ['count-books'],
		mutationFn: () => {
			return fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/analytics/count-books`,
			).then((res) => res.json());
		},
	});
	const countLoans = useMutation({
		mutationKey: ['count-loans'],
		mutationFn: () => {
			return fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/analytics/count-loans`,
			).then((res) => res.json());
		},
	});
	return { mostLoanedBooks, lastLoans, lastReturns, countBooks, countLoans };
};
