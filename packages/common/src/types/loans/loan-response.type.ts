import { LoanStatus } from '../../enum/loan-status.enum';
import { ILoan } from '../entities/loan.type';
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
export interface ILoanStatistics {
	active: number;
	dueSoon: number;
	overdue: number;
	returned: number;
}


//TODO: revisar como consumir esto en las alertas y los ultimos prestamos
export interface ILoanAlert {
	type: 'overdue' | 'due_soon' | 'info';
	severity: 'error' | 'warning' | 'info';
	message: string;
	loan?: ILoan;
	daysOverdue?: number;
	daysUntilDue?: number;
}