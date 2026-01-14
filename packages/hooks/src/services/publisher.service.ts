import { IApiResponse, IPaginatedResponse, IPublisher } from '@repo/common';
import axios from 'axios';

export class PublisherService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/publisher`;
	public static async getPublishers(page: number, q?: string) {
		return axios.get<IApiResponse<IPaginatedResponse<IPublisher>>>(
			`${PublisherService.baseUrl}?page=${page}${q ? `&q=${q}` : ''}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getAllPublishers() {
		return axios.get<IApiResponse<IPublisher[]>>(
			`${PublisherService.baseUrl}?full=true`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getPublisher(id: number) {
		return axios.get<IApiResponse<IPublisher>>(
			`${PublisherService.baseUrl}/${id}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
