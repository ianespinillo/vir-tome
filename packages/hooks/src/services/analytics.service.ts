import { IApiResponse, ILoan, MostLoanedBooks } from '@repo/common';
import axios, { AxiosRequestConfig } from 'axios';

export class AnalyticsService {
	private static readonly BASE_URL =
		`${process.env.NEXT_PUBLIC_API_URL}/analytics`;
	private static readonly AXIOS_CONFIG: AxiosRequestConfig = {
		withCredentials: true,
		headers: {
			'Content-Type': 'application/json',
		},
	};
	public static async getMostLoanedBooks(lmit?: number) {
		return axios.get<IApiResponse<MostLoanedBooks[]>>(
			`${AnalyticsService.BASE_URL}/most-loaned-books${lmit ? `?limit=${lmit}` : ''}`,
			AnalyticsService.AXIOS_CONFIG,
		);
	}
	public static async getLastReturns() {
		return axios.get<IApiResponse<ILoan[]>>(
			`${AnalyticsService.BASE_URL}/last-returns`,
			AnalyticsService.AXIOS_CONFIG,
		);
	}
	public static async getLastLoans() {
		return axios.get<IApiResponse<ILoan[]>>(
			`${AnalyticsService.BASE_URL}/last-loans`,
			AnalyticsService.AXIOS_CONFIG,
		);
	}
	public static async countBooks() {
		return axios.get<IApiResponse<number>>(
			`${AnalyticsService.BASE_URL}/count-books`,
			AnalyticsService.AXIOS_CONFIG,
		);
	}
	public static async countLoans() {
		return axios.get<IApiResponse<number>>(
			`${AnalyticsService.BASE_URL}/count-loans`,
			AnalyticsService.AXIOS_CONFIG,
		);
	}
}
