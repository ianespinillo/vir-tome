import {
	AddUserToTenantDto,
	IApiResponse,
	IPaginatedResponse,
	IUser,
	IUserTenant,
	ROLES,
	UsersQueriesDto,
} from '@repo/common';
import axios from 'axios';

export class UsersService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/users`;
	public static async getUsers(queries: UsersQueriesDto) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(queries)) {
			if (value) {
				params.append(key, value.toString());
			}
		}
		return await axios.get<IApiResponse<IPaginatedResponse<IUser>>>(
			`${UsersService.baseUrl}?${params.toString()}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getUser(id: number) {
		return await axios.get<IApiResponse<IUser>>(`${UsersService.baseUrl}/${id}`, {
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
	public static async getLastRegisters() {
		return UsersService.getUsers({ page: 1, limit: 5, onlyRecent: true });
	}
	public static async attachUserToTenant(dto: AddUserToTenantDto, id: number) {
		return axios.post<IApiResponse<IUser>>(
			`${UsersService.baseUrl}/${id}/attach-tenant`,
			dto,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getUserTenants(id: number) {
		return axios.get<IApiResponse<IUserTenant[]>>(
			`${UsersService.baseUrl}/${id}/tenants`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
