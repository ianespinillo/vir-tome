import { IApiResponse, IDashboardResponse, ILoansByMonth } from '@repo/common';
import axios from 'axios';

export class SuperAdminService {
	private static readonly baseUrl =
		`${process.env.NEXT_PUBLIC_API_URL}/super-admin`;

	public static async getDashMetrics() {
		return await axios.get<IApiResponse<IDashboardResponse>>(
			`${SuperAdminService.baseUrl}/dashboard`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async loansByMonth() {
		return await axios.get<IApiResponse<ILoansByMonth[]>>(
			`${SuperAdminService.baseUrl}/loans/monthly`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
