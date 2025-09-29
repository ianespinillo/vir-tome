import {
	IsEmail,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class UpdatePersonalDataDto {
	@IsString()
	@IsOptional()
	name!: string;

	@IsString()
	@IsOptional()
	surname!: string;

	@IsEmail()
	@IsOptional()
	email!: string;

	@IsNumber()
	@IsOptional()
	role_id!: number;
}

export class UpdatePasswordDto {
	@IsString()
	@IsNotEmpty({
		message: 'La contraseña no puede estar vacia',
	})
	old_password!: string;

	@IsString()
	@IsNotEmpty({
		message: 'La nueva contraseña no puede estar vacia',
	})
	new_password!: string;

	@IsString()
	@IsNotEmpty({
		message: 'La confirmacion de la nueva contraseña no puede estar vacia',
	})
	confirm_new_password!: string;
}
