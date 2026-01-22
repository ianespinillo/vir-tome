import {
	CreateLoanDto,
	GenericHookProps,
	LoanQueriesDTO,
	RequestLoanDTO,
	UpdateLoanStatusDTO,
} from '@repo/common';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { LoanService } from '../services/loan.service';

export const useLoans = (queries: LoanQueriesDTO) => {
	const loans = useQuery({
		queryKey: ['loans', queries],
		queryFn: async () => (await LoanService.listLoans(queries)).data,
		staleTime: 5000,
		refetchOnWindowFocus: false,
	});
	const createLoan = useMutation({
		mutationFn: async (data: CreateLoanDto) =>
			(await LoanService.createLoan(data)).data,
		onSuccess: () => {
			loans.refetch();
		},
	});
	const finishLoan = useMutation({
		mutationFn: async (id: number) => (await LoanService.returnLoan(id)).data,
		onSuccess: () => {
			loans.refetch();
		},
	});
	const findLoan = useMutation({
		mutationFn: async (id: number) => (await LoanService.getLoan(id)).data,
	});
	return {
		loans,
		createLoan,
		finishLoan,
		findLoan,
	};
};

export const useMyLoans = (queries: LoanQueriesDTO) => {
	queries.onlyMyLoans = true;
	const getMyLoans = useQuery({
		queryKey: ['my-loans', queries],
		queryFn: async () => (await LoanService.myLoans(queries)).data,
	});
	const requestLoan = useMutation({
		mutationKey: ['request-loan'],
		mutationFn: async (data: RequestLoanDTO) =>
			(await LoanService.requestLoan(data)).data,
	});
	return {
		getMyLoans,
		requestLoan,
	};
};

export const useLoansRequest = (queries: LoanQueriesDTO) => {
	const lastRequests = useQuery({
		queryKey: ['last-request', queries],
		queryFn: async () => (await LoanService.getLastRequests(queries)).data,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		refetchInterval: 5000,
	});
	const updateLoanStatus = useMutation({
		mutationKey: ['loan-status'],
		mutationFn: async (dto: UpdateLoanStatusDTO) =>
			(await LoanService.updateLoanStatus(dto)).data,
		onSuccess: () => lastRequests.refetch(),
	});
	return {
		lastRequests,
		updateLoanStatus,
	};
};


export const useMyStats = () => {
	const myStats = useQuery({
		queryKey: ['my-loans-stats'],
		queryFn: async () => (await LoanService.getStatistics()).data,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		refetchInterval: 5000,
	});
	const myAlerts = useQuery({
		queryKey: ['my-loans-alerts'],
		queryFn: async () => (await LoanService.getAlerts()).data,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		refetchInterval: 5000,
	});
	const myLastLoans = useQuery({
		queryKey: ['my-last-loans'],
		queryFn: async () => (await LoanService.myLoans({
			page: 1,
			limit: 5,
			onlyMyLoans: true,
			relations: ['book', 'book.publisher'],
		})).data,	
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
		refetchInterval: 5000,
	});
	return {
		myStats,
		myAlerts,
		myLastLoans,
	};
};