import { Type } from 'class-transformer';
import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';
import { ROLES } from '../../enum/roles.enum';

export class SignUpDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(100)
	email!: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(100)
	name!: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(100)
	surname!: string;

	@IsNotEmpty()
	@IsIn(Object.values(ROLES))
	role!: ROLES;

	@IsOptional()
	@IsNotEmpty()
	tenantId?: number;
}
