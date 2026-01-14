import { IBook } from './book.type';
import { IGeneric } from './generic.type';

export interface ICategory extends IGeneric {
	name: string;
	books: IBook[];
}
