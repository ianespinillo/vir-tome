import { Transform } from 'class-transformer';
import {
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { LoanBorrowerType } from '../../enum/loan-borrower-type.enum';
export class CreateLoanDto {
	@IsNotEmpty({
		message: 'El nombre del responsable es requerido',
	})
	@IsNotEmpty({
		message: 'El libro es requerido',
	})
	@IsNumber()
	bookId!: number;

	@IsNotEmpty({
		message: 'La cantidad es requerida',
	})
	@Min(1, {
		message: 'La cantidad debe ser mayor a 0',
	})
	quantity!: number;

	@Transform(({ value }) => new Date(value))
	@IsNotEmpty({
		message: 'La fecha de prestamo es requerida',
	})
	@IsDate()
	returnDate!: Date;

	@IsOptional()
	@IsNumber()
	user_id?: number;

	@IsOptional()
	@IsString()
	borrower_name?: string;

	@IsOptional()
	@IsString()
	borrower_email?: string;

	@IsOptional()
	@IsString()
	borrower_phone?: string;

	@IsOptional()
	@IsString()
	borrower_national_id?: string;

	@IsNotEmpty()
	@IsEnum(LoanBorrowerType, {
		message: 'El tipo de prestamo provisto es incompatible',
	})
	borrower_type!: LoanBorrowerType;
}
