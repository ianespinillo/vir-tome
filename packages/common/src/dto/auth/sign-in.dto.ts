import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';
import { PAYLOAD_TYPE } from '../../enum/payload-type.enum';

export class SignInDto {
	@IsNotEmpty({ message: 'El correo es requerido' })
	@IsString({ message: 'Dirección de correo electrónico inválida' })
	@IsEmail({}, { message: 'Debe ser una dirección de correo válida' })
	email!: string;

	@IsNotEmpty({ message: 'La contraseña es requerida' })
	@MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
	password!: string;

	@IsEnum(PAYLOAD_TYPE, { message: 'Tipo de login inválido' })
	type!: PAYLOAD_TYPE.USER_LOGIN;

	@IsOptional()
	tenantId?: number; // solo requerido si type === TENANT
}
