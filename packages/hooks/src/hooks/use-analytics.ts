import { IApiResponse, ILoan, MostLoanedBooks } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService } from '../services/analytics.service';

export const useAnalytics = (limit = 5) => {
	const mostLoanedBooks = useQuery<
		IApiResponse<MostLoanedBooks[]>,
		IApiResponse<Error>
	>({
		queryKey: ['most-loaned-books', limit],
		queryFn: async () => (await AnalyticsService.getMostLoanedBooks(limit)).data,
	});
	const lastLoans = useQuery<IApiResponse<ILoan[]>, IApiResponse<Error>>({
		queryKey: ['last-loans'],
		queryFn: async () => (await AnalyticsService.getLastLoans()).data,
		refetchOnWindowFocus: false,
	});
	const lastReturns = useQuery<IApiResponse<ILoan[]>, IApiResponse<Error>>({
		queryKey: ['last-returns'],
		queryFn: async () => (await AnalyticsService.getLastReturns()).data,
		refetchOnWindowFocus: false,
	});

	const countBooks = useQuery<IApiResponse<number>, IApiResponse<Error>>({
		queryKey: ['count-books'],
		queryFn: async () => (await AnalyticsService.countBooks()).data,
	});
	const countLoans = useQuery<IApiResponse<number>, IApiResponse<Error>>({
		queryKey: ['count-loans'],
		queryFn: async () => (await AnalyticsService.countLoans()).data,
	});
	return { mostLoanedBooks, lastLoans, lastReturns, countBooks, countLoans };
};
