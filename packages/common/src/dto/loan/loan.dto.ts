import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
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
}
