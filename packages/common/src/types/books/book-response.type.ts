import { IBook } from '../entities/book.type';

export interface IBookResponse extends Partial<IBook> {
	categoriesNames: string[];
}
