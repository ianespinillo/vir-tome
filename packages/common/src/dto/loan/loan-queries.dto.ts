import {
	IsArray,
	IsBoolean,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';
import { LoanBorrowerType } from '../../enum/loan-borrower-type.enum';
import { LoanStatus } from '../../enum/loan-status.enum';
import { ILoan } from '../../types/entities/loan.type';
import { ILoansQueries } from '../../types/loans/loan-queries.type';

export class LoanQueriesDTO implements ILoansQueries {
	@IsOptional()
	@IsNumber()
	page = 1;
	@IsOptional()
	@IsNumber()
	limit = 5;
	@IsOptional()
	@IsString()
	search?: string;
	@IsOptional()
	@IsString()
	orderBy?: keyof ILoan;
	@IsNotEmpty()
	@IsString()
	orderDir: 'ASC' | 'DESC' = 'ASC';
	@IsOptional()
	@IsBoolean()
	withDeleted?: boolean;
	@IsOptional()
	@IsDate()
	fromDate?: Date;
	@IsOptional()
	@IsDate()
	toDate?: Date;
	@IsOptional()
	@IsArray()
	ids?: number[];
	@IsOptional()
	@IsArray()
	relations?: keyof ILoan[];
	@IsOptional()
	@IsArray()
	fields?: (keyof ILoan)[];
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
	@IsOptional()
	@IsEnum(LoanStatus)
	status?: LoanStatus;
	@IsOptional()
	@IsEnum(LoanBorrowerType)
	borrowerType?: LoanBorrowerType;
}
