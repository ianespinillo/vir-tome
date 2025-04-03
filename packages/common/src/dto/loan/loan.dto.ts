import { IsDate, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateLoanDto {
	@IsNotEmpty()
	@IsString()
	borrowerName!: string;

	@IsNotEmpty()
	@IsNumber()
	bookId!: number;

	@IsNotEmpty()
	@Min(1)
	quantity!: number;

	@IsNotEmpty()
	@IsDate()
	returnDate?: Date;
}
