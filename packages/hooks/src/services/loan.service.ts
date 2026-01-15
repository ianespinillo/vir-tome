import {
	CreateLoanDto,
	IApiResponse,
	ILoan,
	IPaginatedResponse,
	RequestLoanDTO,
} from '@repo/common';
import axios, { AxiosRequestConfig } from 'axios';

export class LoanService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/loan`;
	private static readonly config: AxiosRequestConfig = {
		withCredentials: true,
		headers: {
			'Content-Type': 'application/json',
		},
	};
	public static async createLoan(dto: CreateLoanDto) {
		return axios.post<IApiResponse<ILoan>>(
			LoanService.baseUrl,
			dto,
			LoanService.config,
		);
	}
	public static async listLoans(page: number) {
		return axios.get<IApiResponse<IPaginatedResponse<ILoan>>>(
			`${LoanService.baseUrl}?page=${page}`,
			LoanService.config,
		);
	}
	public static async returnLoan(id: number) {
		return axios.put<IApiResponse<ILoan>>(
			`${LoanService.baseUrl}/return/${id}`,
			null,
			LoanService.config,
		);
	}
	public static async myLoans(page: number) {
		return axios.get<IApiResponse<IPaginatedResponse<ILoan>>>(
			`${LoanService.baseUrl}/my?page=${page}`,
			LoanService.config,
		);
	}
	public static async getLoan(id: number) {
		return axios.get<IApiResponse<ILoan>>(`${LoanService.baseUrl}/${id}`);
	}
	public static async requestLoan(dto: RequestLoanDTO) {
		return axios.post<IApiResponse<ILoan>>(
			`${LoanService.baseUrl}/request`,
			dto,
			LoanService.config,
		);
	}
}
