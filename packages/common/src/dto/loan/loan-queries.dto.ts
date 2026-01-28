import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { LoanBorrowerType } from '../../enum/loan-borrower-type.enum';
import { LoanStatus } from '../../enum/loan-status.enum';
import { ILoan } from '../../types/entities/loan.type';
import { ILoansQueries } from '../../types/loans/loan-queries.type';
import { BaseQueriesDto } from '../common/base-queries.dto';

export class LoanQueriesDTO
	extends BaseQueriesDto<ILoan>
	implements ILoansQueries
{
	@IsOptional()
	@IsEnum(LoanStatus)
	status?: LoanStatus;

	@IsOptional()
	@IsEnum(LoanBorrowerType)
	borrowerType?: LoanBorrowerType;

	// Filtros de usuario y libro
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	userId?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	bookId?: number;

	// Filtros de vencimiento
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isOverdue?: boolean;

	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	dueSoon?: boolean;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	dueSoonDays?: number = 7;

	// Filtros de fecha específicos
	@IsOptional()
	@Type(() => Date)
	loanDateFrom?: Date;

	@IsOptional()
	@Type(() => Date)
	loanDateTo?: Date;

	@IsOptional()
	@Type(() => Date)
	returnDateFrom?: Date;

	@IsOptional()
	@Type(() => Date)
	returnDateTo?: Date;

	// Filtros booleanos
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	onlyMyLoans?: boolean;

	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	onlyPending?: boolean;
}
