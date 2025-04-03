import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string;
}

export class UpdateCategoryDto {
	@IsNotEmpty()
	@IsNumber()
	id!: number;

	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string;
}
