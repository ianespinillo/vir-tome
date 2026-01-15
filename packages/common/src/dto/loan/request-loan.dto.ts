import { Transform } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class RequestLoanDTO {
	@IsNotEmpty({ message: 'El libro es requerido' })
	@IsNumber()
	bookId!: number;

	@IsNotEmpty({ message: 'La cantidad es requerida' })
	@IsNumber()
	@Min(1, { message: 'La cantidad minima de libros es 1' })
	quantity!: number;
	@Transform(({ value }) => new Date(value))
	@IsNotEmpty({
		message: 'La fecha de prestamo es requerida',
	})
	@IsDate()
	returnDate!: Date;
}
