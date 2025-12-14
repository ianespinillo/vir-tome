import { IPaginationMeta } from './pagination.type';

export interface IApiResponse<T> {
	status: number;
	message: string;
	timestamp: string;
	data: T | null;
}

export interface IPaginatedResponse<T> {
	items: T[];
	meta: IPaginationMeta;
}

export interface IMessageResponse {
	message: string;
}
