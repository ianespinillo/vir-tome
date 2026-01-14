import { IApiResponse, ICategory, IPaginatedResponse } from '@repo/common';
import axios from 'axios';

export class CategoryService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/categories`;
	public static async getCategories(page: number, q?: string) {
		return axios.get<IApiResponse<IPaginatedResponse<ICategory>>>(
			`${CategoryService.baseUrl}?page=${page}${q ? `q=${q}` : ''}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getAllCategories() {
		return axios.get<IApiResponse<ICategory[]>>(
			`${CategoryService.baseUrl}?full=true`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
