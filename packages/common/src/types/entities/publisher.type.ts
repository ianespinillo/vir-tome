import { IBook } from './book.type';
import { IMultitenant } from './multitenant.type';

export interface IPublisher extends IMultitenant {
	name: string;
	books: IBook[];
}
