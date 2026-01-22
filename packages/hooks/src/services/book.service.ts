import {
	BooksQueriesDto,
	CreateBookDto,
	IApiResponse,
	IBook,
	IPaginatedResponse,
} from '@repo/common';
import axios from 'axios';

export class BookService {
	private static readonly baseUrl =
		`${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.NEXT_PUBLIC_API_URL}/book`;

	public static async getBooks(queries: BooksQueriesDto) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(queries)) {
			if (value) {
				params.append(key, value.toString());
			}
		}
		return await axios.get<IApiResponse<IPaginatedResponse<IBook>>>(
			`${BookService.baseUrl}?${params.toString()}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getBookById(id: string | number) {
		return await axios.get<IApiResponse<IBook>>(`${BookService.baseUrl}/${id}`, {
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
	public static async createBook(data: CreateBookDto) {
		return await axios.post<IApiResponse<IBook>>(`${BookService.baseUrl}`, data, {
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
	public static async updateBook(
		id: string | number,
		data: Partial<CreateBookDto>,
	) {
		return await axios.put<IApiResponse<IBook>>(
			`${BookService.baseUrl}/${id}`,
			data,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async deleteBook(id: string | number) {
		return await axios.delete<IApiResponse<null>>(
			`${BookService.baseUrl}/${id}`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
	public static async getAllBooks() {
		return await axios.get<IApiResponse<IBook[]>>(
			`${BookService.baseUrl}?full=true`,
			{
				withCredentials: true,
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);
	}
}
