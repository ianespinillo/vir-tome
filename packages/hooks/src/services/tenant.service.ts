import {
	IApiResponse,
	IMessageResponse,
	IPaginatedResponse,
	ITenant,
	UpdateTenantDto,
} from '@repo/common';
import axios from 'axios';
export class TenantService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/tenants`;

	public static async getPaginatedTenants(page: number, searchTerm?: string) {
		return await axios.get<IApiResponse<IPaginatedResponse<ITenant[]>>>(
			`${TenantService.baseUrl}?page=${page}&search=${searchTerm}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getTenantById(id: number) {
		return await axios.get<IApiResponse<ITenant>>(
			`${TenantService.baseUrl}/${id}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getTenantBySubdomain(subdomain: string) {
		return await axios.get<IApiResponse<ITenant>>(
			`${TenantService.baseUrl}/subdomain/${subdomain}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async updateTenant(id: number, data: UpdateTenantDto) {
		return await axios.patch<IApiResponse<ITenant>>(
			`${TenantService.baseUrl}/${id}`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}

	public static async deleteTenant(id: number) {
		return await axios.delete<IApiResponse<ITenant>>(
			`${TenantService.baseUrl}/${id}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}

	public static async createTenant(data: UpdateTenantDto) {
		return await axios.post<IApiResponse<ITenant>>(
			`${TenantService.baseUrl}`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}

	public static async activateTenant(id: number) {
		return await axios.patch<IApiResponse<IMessageResponse>>(
			`${TenantService.baseUrl}/activate/${id}`,
			{},
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async deactivateTenant(id: number) {
		return await axios.patch<IApiResponse<IMessageResponse>>(
			`${TenantService.baseUrl}/deactivate/${id}`,
			{},
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getLastTenants() {
		return await axios.get<IApiResponse<ITenant[]>>(
			`${TenantService.baseUrl}/lasts`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getAllTenants() {
		return axios.get<IApiResponse<ITenant[]>>(
			`${TenantService.baseUrl}?full=true`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
