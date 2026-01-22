import { Transform, Type } from 'class-transformer';
import {
	IsOptional,
	IsInt,
	Min,
	Max,
	IsString,
	IsEnum,
	IsBoolean,
	IsArray,
} from 'class-validator';
import { IQueriesDto, RelationKeys } from '../../types/common/api-queries.type';
import { IGeneric } from '../../types/entities/generic.type';

export class BaseQueriesDto<T extends IGeneric> implements IQueriesDto<T>{
	// Paginación
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;

	// Búsqueda
	@IsOptional()
	@IsString()
	search?: string;

	// Ordenamiento (debe ser sobrescrito en clases hijas)
	@IsOptional()
	@IsString()
	orderBy?: keyof T;

	@IsOptional()
	@IsEnum(['ASC', 'DESC'])
	orderDir?: 'ASC' | 'DESC' = 'ASC';

	// Filtros generales
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	withDeleted?: boolean = false;

	@IsOptional()
	@Type(() => Date)
	fromDate?: Date;

	@IsOptional()
	@Type(() => Date)
	toDate?: Date;

	@IsOptional()
	@Type(() => Number)
	@IsArray()
	@IsInt({ each: true })
	ids?: number[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	relations?: RelationKeys<T>[]; // Ahora soporta relaciones anidadas como book.publisher

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	fields?: (keyof T)[];

	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	isActive?: boolean;
}