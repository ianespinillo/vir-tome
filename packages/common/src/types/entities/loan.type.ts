import { LoanBorrowerType } from '../../enum/loan-borrower-type.enum';
import { LoanStatus } from '../../enum/loan-status.enum';
import { IBook } from './book.type';
import { IGeneric } from './generic.type';
import { IUser } from './user.type';

export interface ILoan extends IGeneric {
	borrower_type: LoanBorrowerType;

	user_id?: number;
	user?: IUser;

	borrower_name?: string;
	borrower_email?: string;
	borrower_phone?: string;
	borrower_national_id?: string;

	book_id: number;
	book: IBook;
	quantity: number;
	loan_date: Date;
	return_date: Date;
	status: LoanStatus;

	getUser(): IUser | null;
	getBook(): IBook;
	isOverdue(): boolean;
}
