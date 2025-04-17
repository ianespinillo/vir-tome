import type { UseMutationResult } from '@tanstack/react-query';
import type * as React from 'react';
import type { CreateBookDto, UpdateBookDto } from '../dto/books/book.dto';

export interface IBook {
	id: number;
	title: string;
	publicationYear: number;
	categories: string[];
	availableQuantity: number;
	publisher: string;
}

export interface ICategory {
	id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
}

export interface IPaginatedResponse<T> {
	data: T[];
	total: number;
	current_page: number;
	last_page: number;
}

export interface IPublisherResponse {
	id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export interface IBookResponse {
	id: number;
	title: string;
	publicationYear: number;
	categories: string[];
	availableQuantity: number;
	publisher: string;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
}

export interface IBooKForm {
	id?: number;
	title: string;
	publicationYear: number;
	categoriesIds: number[];
	availableQuantity: number;
	publisherId: number;
}

export interface IBookContext {
	data: IPaginatedResponse<IBookResponse>;
	page: number;
	setPage: React.Dispatch<React.SetStateAction<number>>;
	isLoading: boolean;
	refetch: () => void;
	fetchNextPage: () => void;
	fetchPreviousPage: () => void;
	createBook: UseMutationResult<IBook, Error, CreateBookDto, unknown>;
	findBook: UseMutationResult<IBooKForm, Error, string | number, unknown>;
	updateBook: UseMutationResult<IBook, Error, UpdateBookDto, unknown>;
	deleteBook: UseMutationResult<IBook, Error, string | number, unknown>;
}
