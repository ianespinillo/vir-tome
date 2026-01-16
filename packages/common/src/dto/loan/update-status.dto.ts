import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { LoanStatus } from '../../enum/loan-status.enum';

export class UpdateLoanStatusDTO {
	@IsNotEmpty()
	@IsNumber()
	loanId!: number;

	@IsNotEmpty()
	@IsEnum(LoanStatus)
	status!: LoanStatus;
}
