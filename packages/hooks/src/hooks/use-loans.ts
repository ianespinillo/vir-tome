import {
	CreateLoanDto,
	GenericHookProps,
	RequestLoanDTO,
	UpdateLoanStatusDTO,
} from '@repo/common';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { LoanService } from '../services/loan.service';

export const useLoans = ({ page, searchTerm }: GenericHookProps) => {
	const loans = useQuery({
		queryKey: ['loans', page],
		queryFn: async () => (await LoanService.listLoans(page)).data,
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

export const useMyLoans = ({ page, searchTerm }: GenericHookProps) => {
	const getMyLoans = useQuery({
		queryKey: ['my-loans', page],
		queryFn: async () => (await LoanService.myLoans(page)).data,
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

export const useLoansRequest = ({ page }: GenericHookProps) => {
	const lastRequests = useQuery({
		queryKey: ['last-request', page],
		queryFn: async () => (await LoanService.getLastRequests(page)).data,
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
