import {
	IsArray,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class CreateBookDto {
	@IsNotEmpty({ message: 'El título es requerido' })
	@IsString({
		message: 'El título debe ser una cadena de texto',
	})
	title!: string;

	@IsInt()
	@Min(1800, { message: 'El año de publicación debe ser mayor a 1800' })
	@Max(new Date().getFullYear(), {
		message: `El año de publicación debe ser menor a ${new Date().getFullYear()}`,
	})
	publicationYear!: number;

	@Min(1, {
		message: 'La cantidad disponible debe ser mayor a 0',
	})
	@IsInt()
	availableQuantity!: number;

	@IsArray()
	@IsNotEmpty({
		message: 'Al menos debe poseer una categoría',
	})
	@IsInt({ each: true })
	categoryIds!: number[]; // Para relaciones ManyToMany con Category

	@IsInt()
	@IsNotEmpty({
		message: 'La editorial es requerida',
	})
	publisherId!: number; // Para relación ManyToMany con Publisher
}

export class UpdateBookDto {
	@IsInt()
	@IsOptional()
	id!: number;

	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsInt()
	@Min(1800)
	@Max(new Date().getFullYear())
	publicationYear!: number;

	@IsInt()
	@Min(1)
	availableQuantity!: number;

	@IsArray()
	@IsNotEmpty()
	categoryIds!: number[]; // Para relaciones ManyToMany con Category

	@IsInt()
	@IsNotEmpty()
	publisherId!: number; // Para relación ManyToMany con Publisher
}

export class UpdateStockDto {
	@IsInt()
	@IsNotEmpty()
	id!: number;

	@IsInt()
	@IsNotEmpty()
	quantity!: number;
}
