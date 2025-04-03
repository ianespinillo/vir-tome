import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreatePublisherDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string;
}

export class UpdatePublisherDto {
	@IsNotEmpty()
	@IsNumber()
	id!: number;

	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name!: string;
}
