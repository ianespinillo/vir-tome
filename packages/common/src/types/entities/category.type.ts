import { IBook } from './book.type';
import { IMultitenant } from './multitenant.type';

export interface ICategory extends IMultitenant {
	name: string;
	books: IBook[];
}
