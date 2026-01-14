import { IBook } from './book.type';
import { IGeneric } from './generic.type';

export interface IPublisher extends IGeneric {
	name: string;
	books: IBook[];
}
