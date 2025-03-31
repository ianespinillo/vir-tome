import { IsString, IsNotEmpty, MaxLength, IsNumber } from 'class-validator';

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
  