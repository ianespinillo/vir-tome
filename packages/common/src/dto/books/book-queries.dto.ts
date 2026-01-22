import { IsOptional, IsInt, Min, Max, IsBoolean, IsArray, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseQueriesDto } from '../common/base-queries.dto';
import { IBook } from '../../types/entities/book.type';
import { IBooksQueries } from '../../types/books/book-queries.type';

export class BooksQueriesDto extends BaseQueriesDto<IBook> implements IBooksQueries {
    
    @IsOptional()
    @Transform(({ value }) => {
        // Maneja casos donde llega un solo id como string o varios como array
        if (typeof value === 'string') return value.split(',').map(Number);
        if (Array.isArray(value)) return value.map(Number);
        return value;
    })
    @IsArray()
    @IsInt({ each: true })
    categoryIds?: number[];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    publisherId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minYear?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    // El +10 es dinámico al momento de cargar la clase, está bien.
    @Max(new Date().getFullYear() + 10) 
    maxYear?: number;

    @IsOptional()
    @Transform(({ value }) => {
        // En QueryParams, "true" llega como string. Esto asegura el booleano.
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    hasAvailableStock?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minQuantity?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxQuantity?: number;
}