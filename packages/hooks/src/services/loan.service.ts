import {
	CreateLoanDto,
	IApiResponse,
	ILoan,
	ILoanAlert,
	ILoanStatistics,
	IPaginatedResponse,
	LoanQueriesDTO,
	RequestLoanDTO,
	UpdateLoanStatusDTO,
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
	public static async listLoans(queries: LoanQueriesDTO) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(queries)) {
			if(Array.isArray(value)) {
				value.forEach(v => params.append(key, v.toString()));
				continue;
			}
			if (value) {
				params.append(key, value.toString());
			}
		}
		return axios.get<IApiResponse<IPaginatedResponse<ILoan>>>(
			`${LoanService.baseUrl}?${params.toString()}`,
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
	public static async myLoans(queries: LoanQueriesDTO) {
		return this.listLoans(queries);
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
	public static async getLastRequests(queries: LoanQueriesDTO) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(queries)) {
			if (value) {
				params.append(key, value.toString());
			}
		}
		return axios.get<IApiResponse<IPaginatedResponse<ILoan>>>(
			`${LoanService.baseUrl}/requests?${params.toString()}`,
			LoanService.config,
		);
	}
	public static async updateLoanStatus(dto: UpdateLoanStatusDTO) {
		return axios.put<IApiResponse<ILoan>>(
			`${LoanService.baseUrl}/${dto.loanId}`,
			dto,
			LoanService.config,
		);
	}
	public static async getStatistics() {
		return axios.get<IApiResponse<ILoanStatistics>>(
			`${LoanService.baseUrl}/statistics`,
			LoanService.config,
		);
	}
	public static async getAlerts() {
		return axios.get<IApiResponse<ILoanAlert[]>>(
			`${LoanService.baseUrl}/alerts`,
			LoanService.config,
		);
	}

}