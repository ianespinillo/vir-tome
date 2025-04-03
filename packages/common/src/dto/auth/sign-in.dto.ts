import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
	@IsNotEmpty({
		message: 'El correo es requerido',
	})
	@IsString({
		message: 'Dirección de correo electrónico inválida',
	})
	@IsEmail(
		{},
		{
			message: 'Debe ser una dirección de correo válida',
		},
	)
	email!: string;

	@IsNotEmpty({
		message: 'La contraseña es requerida',
	})
	@MinLength(8, {
		message: 'La contraseña debe tener al menos 8 caracteres',
	})
	password!: string;
}
