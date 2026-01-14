import {
	AddUserToTenantDto,
	IApiResponse,
	IPaginatedResponse,
	IUser,
	ROLES,
} from '@repo/common';
import axios from 'axios';
import { IUserTenant } from 'packages/common/dist';

export class UsersService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/users`;
	public static async getUsersByRole(page: number, role?: ROLES, q?: string) {
		return await axios.get<IApiResponse<IPaginatedResponse<IUser>>>(
			`${UsersService.baseUrl}?role=${role ? role : ''}&page=${page}&q=${q}`,
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
		return axios.get<IApiResponse<IUser[]>>(`${UsersService.baseUrl}/lasts`, {
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});
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
