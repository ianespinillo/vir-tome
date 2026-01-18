import { LoanBorrowerType } from '../../enum/loan-borrower-type.enum';
import { LoanStatus } from '../../enum/loan-status.enum';
import { IQueriesDto } from '../common/api-queries.type';
import { ILoan } from '../entities/loan.type';

export interface ILoansQueries extends IQueriesDto<ILoan> {
	status?: LoanStatus;
	borrowerType?: LoanBorrowerType;
}
