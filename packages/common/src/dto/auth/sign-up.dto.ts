import { IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";

export class SignUpDto{
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    email!: string;
    
    @IsNotEmpty()
    @IsString()
    @MaxLength(8)
    password!: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    name!: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    surname!: string;

    @IsNotEmpty()
    @IsNumber()
    roleId!: number;
}