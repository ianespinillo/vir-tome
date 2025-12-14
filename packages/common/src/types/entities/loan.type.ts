import { LoanStatus } from '../../enum/loan-status.enum';
import { IBook } from './book.type';
import { IGeneric } from './generic.type';
import { IUser } from './user.type';

export interface ILoan extends IGeneric {
	user_id: number;
	user: IUser;
	book_id: number;
	book: IBook;
	quantity: number;
	loan_date: Date;
	return_date: Date;
	status: LoanStatus;
	getUser(): IUser;
	getBook(): IBook;
	isOverdue(): boolean;
}
