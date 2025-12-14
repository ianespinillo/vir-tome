import { LoanStatus } from '../../enum/loan-status.enum';
export interface ILoanResponse {
	id: number;
	borrowerName: string;
	quantity: number;
	loanDate: Date;
	book: string;
	returnDate: Date;
	status: LoanStatus;
}

export interface ILoansByMonth {
	name: string;
	total: number;
}
