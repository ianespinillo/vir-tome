import type { TenantSettings } from '@repo/common';
import { Type } from 'class-transformer';
// src/tenants/dto/create-tenant.dto.ts
import {
	IsBoolean,
	IsEmail,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';

class SchoolInfoDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	address?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	phone?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	principal?: string;

	@IsOptional()
	@IsString()
	logo_url?: string;
}

class LimitsDto {
	@IsOptional()
	@IsNumber()
	@Min(1)
	max_books?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	max_users?: number;

	@IsOptional()
	@IsNumber()
	@Min(1)
	max_loans?: number;
}

class TenantSettingsDto implements TenantSettings {
	@IsOptional()
	@IsIn(['light', 'dark', 'blue', 'green'])
	theme?: 'light' | 'dark' | 'blue' | 'green';

	@IsOptional()
	@IsString({ each: true })
	features?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => SchoolInfoDto)
	school_info?: SchoolInfoDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => LimitsDto)
	limits?: LimitsDto;
}

export class CreateTenantDto {
	@IsNotEmpty()
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	@Matches(/^[a-z0-9-]+$/, {
		message:
			'Subdomain must contain only lowercase letters, numbers, and hyphens',
	})
	subdomain!: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	name!: string;

	@IsNotEmpty()
	@IsEmail()
	contact_email!: string;

	@IsOptional()
	@IsBoolean()
	is_active?: boolean;

	@IsOptional()
	@IsBoolean()
	is_demo?: boolean;

	@IsOptional()
	@ValidateNested()
	@Type(() => TenantSettingsDto)
	settings?: TenantSettingsDto;

	@IsOptional()
	@IsIn(['basic', 'premium', 'enterprise'])
	plan?: string;

	@IsOptional()
	subscription_expires_at?: Date;
	@IsEmail()
	admin_email!: string;

	@IsNotEmpty()
	@IsString()
	admin_name!: string;

	@IsNotEmpty()
	@IsString()
	admin_surname!: string;
}

export interface TenantMetricsDto {
	users: {
		total: number;
		active: number; // Últimos 30 días
		by_role: {
			admin: number;
			librarian: number;
			teacher: number;
			student: number;
		};
	};
	books: {
		total: number;
		available: number;
		borrowed: number;
	};
	loans: {
		total: number;
		active: number;
		overdue: number;
		returned: number;
	};
	activity: {
		last_login: Date | null;
		recent_activity: Array<{
			type: string;
			count: number;
			date: string;
		}>;
	};
}
