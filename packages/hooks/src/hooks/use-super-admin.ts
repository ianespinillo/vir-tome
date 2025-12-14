import { IApiResponse, IDashboardResponse, ILoansByMonth } from '@repo/common';
import { useQuery } from '@tanstack/react-query';
import { SuperAdminService } from '../services/super-admin.service';

export const useSuperAdmin = () => {
	const dashMetrics = useQuery<
		IApiResponse<IDashboardResponse>,
		IApiResponse<Error>
	>({
		queryKey: ['dashMetrics'],
		queryFn: async () => (await SuperAdminService.getDashMetrics()).data,
		staleTime: 5000,
		refetchOnWindowFocus: false,
		retry: false,
		retryOnMount: false,
	});
	const loansByMonth = useQuery<
		IApiResponse<ILoansByMonth[]>,
		IApiResponse<Error>
	>({
		queryKey: ['loansByMonth'],
		queryFn: async () => (await SuperAdminService.loansByMonth()).data,
		staleTime: 5000,
		refetchOnWindowFocus: false,
		retry: false,
		retryOnMount: false,
	});
	return { dashMetrics, loansByMonth };
};
