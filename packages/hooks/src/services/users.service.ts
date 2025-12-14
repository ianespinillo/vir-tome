import { IApiResponse, IPaginatedResponse, IUser, ROLES } from '@repo/common';
import axios from 'axios';

export class UsersService {
	private static readonly baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/users`;

	public static async getUsersByRole(role: ROLES, page: number, q?: string) {
		return await axios.get<IApiResponse<IPaginatedResponse<IUser>>>(
			`${UsersService.baseUrl}?role=${role}&page=${page}&q=${q}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getUser(id: number) {
		return await axios.get<IApiResponse<IPaginatedResponse<IUser>>>(
			`${UsersService.baseUrl}/${id}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getLastRegisters() {
		return axios.get<IApiResponse<IUser[]>>(`${UsersService.baseUrl}/lasts`, {
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
}
