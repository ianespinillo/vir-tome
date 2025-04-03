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
	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsInt()
	@Min(1800)
	@Max(new Date().getFullYear())
	publicationYear!: number;

	@IsString()
	@IsNotEmpty()
	genre!: string;

	@IsInt()
	@Min(1)
	copies!: number;

	@IsArray()
	@IsNotEmpty()
	@IsInt({ each: true })
	categoryIds!: number[]; // Para relaciones ManyToMany con Category

	@IsInt()
	@IsNotEmpty()
	publisherId!: number; // Para relación ManyToMany con Publisher
}

export class UpdateBookDto {
	@IsInt()
	@IsOptional()
	id?: number;

	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsInt()
	@Min(1800)
	@Max(new Date().getFullYear())
	publicationYear!: number;

	@IsString()
	@IsNotEmpty()
	genre!: string;

	@IsInt()
	@Min(1)
	copies!: number;

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
