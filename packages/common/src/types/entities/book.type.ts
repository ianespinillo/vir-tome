import { ICategory } from './category.type';
import { ILoan } from './loan.type';
import { IMultitenant } from './multitenant.type';
import { IPublisher } from './publisher.type';

export interface IBook extends IMultitenant {
	title: string;
	publicationYear: number;
	availableQuantity: number;
	loans: ILoan[];
	categories: ICategory[];
	publisher: IPublisher;
	getLoansHistory(): ILoan[];
	getCategories(): ICategory[];
	getPublisher(): IPublisher;
	getCategoriesNames(): string[];
}
