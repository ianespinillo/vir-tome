import {
	IsArray,
	IsBoolean,
	IsEmail,
	IsEnum,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { ROLES } from '../../enum/roles.enum';
import { IUser } from '../../types/entities/user.type';
import { IUsersQueries } from '../../types/users/users-queries.type';
import { BaseQueriesDto } from '../common/base-queries.dto';

export class UsersQueriesDto
	extends BaseQueriesDto<IUser>
	implements IUsersQueries
{
	// Filtros específicos de usuario
	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	emailDomain?: string;

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	surname?: string;

	// Filtros por tenant
	@IsOptional()
	@IsInt()
	tenantId?: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	tenantIds?: number[];

	@IsOptional()
	@IsBoolean()
	hasMultipleTenants?: boolean;

	// Filtros por rol
	@IsOptional()
	@IsInt()
	roleId?: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	roleIds?: number[];

	@IsOptional()
	@IsEnum(ROLES)
	roleName?: ROLES;

	@IsOptional()
	@IsArray()
	@IsEnum(ROLES, { each: true })
	rolesNames?: ROLES[];

	// Filtros por actividad
	@IsOptional()
	lastLoginAfter?: Date;

	@IsOptional()
	lastLoginBefore?: Date;

	@IsOptional()
	@IsBoolean()
	hasNeverLoggedIn?: boolean;

	// Filtros por préstamos
	@IsOptional()
	@IsBoolean()
	hasLoans?: boolean;

	@IsOptional()
	@IsBoolean()
	hasActiveLoans?: boolean;

	@IsOptional()
	@IsBoolean()
	hasOverdueLoans?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	minLoansCount?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	maxLoansCount?: number;

	// Filtros de recientes
	@IsOptional()
	@IsBoolean()
	onlyRecent?: boolean;

	@IsOptional()
	@IsInt()
	@Min(1)
	recentDays?: number = 30;
}
