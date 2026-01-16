import { Roles } from '@/auth/decorators/roles.decorator';
import { User } from '@/auth/decorators/user.decorator';
import { IAuthUser } from '@/core/core.types';
import { LoanEntity } from '@/loan/entities/loan.entity';

import {
	Controller,
	Get,
	HttpStatus,
	ParseIntPipe,
	Query,
} from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { IApiResponse, MostLoanedBooks, ROLES } from '@repo/common';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics') // Agrupa los endpoints en Swagger UI.
@Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.LIBRARIAN)
@Controller('analytics')
export class AnalyticsController {
	constructor(private readonly analyticsService: AnalyticsService) {}

	@Get('most-loaned-books')
	@ApiOperation({ summary: 'Obtener los libros más prestados' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Límite de resultados (opcional, default: 3)',
	})
	@ApiOkResponse({
		description: 'Lista de libros más prestados ordenados por frecuencia',
		schema: {
			example: [
				{ id: 1, title: 'El Principito', count: 15 },
				{ id: 2, title: 'Cien años de soledad', count: 10 },
			],
		},
	})
	async getMostLoanedBooks(
		@User() user: IAuthUser,
		@Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
	): Promise<IApiResponse<MostLoanedBooks[]>> {
		const data = await this.analyticsService.getMostLoanedBooks(limit, user);
		return {
			data,
			message: 'Most loaned books retrieved succesfully',
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get('last-loans')
	@ApiOperation({ summary: 'Obtener los últimos préstamos registrados' })
	@ApiOkResponse({
		description: 'Lista de préstamos recientes',
		schema: {
			example: [
				{ id: 101, bookId: 1, userId: 5, date: '2023-10-01' },
				{ id: 102, bookId: 3, userId: 2, date: '2023-09-30' },
			],
		},
	})
	async getLastLoans(
		@User() user: IAuthUser,
	): Promise<IApiResponse<LoanEntity[]>> {
		const data = await this.analyticsService.getLastLoans(user);
		return {
			message: 'Last loans retrieved succesfully',
			data,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
	}

	@Get('count-books')
	@ApiOperation({ summary: 'Obtener el número total de libros' })
	@ApiOkResponse({
		description: 'Conteo de libros registrados',
		schema: {
			example: { count: 42 },
		},
	})
	async countBooks(@User() user: IAuthUser): Promise<IApiResponse<number>> {
		const data = await this.analyticsService.countBooks(user);
		return {
			message: 'Total books retrieved succesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('count-loans')
	@ApiOperation({ summary: 'Obtener el número total de préstamos' })
	@ApiOkResponse({
		description: 'Conteo de préstamos registrados',
		schema: {
			example: { count: 150 },
		},
	})
	async countLoans(@User() user: IAuthUser): Promise<IApiResponse<number>> {
		const data = await this.analyticsService.countLoans(user);
		return {
			message: 'Total of loans retrieved succesfully',
			data: data.count,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('last-returns')
	@ApiOperation({ summary: 'Obtener las últimas devoluciones registradas' })
	@ApiOkResponse({
		description: 'Lista de devoluciones recientes',
		schema: {
			example: [
				{ id: 201, bookId: 1, userId: 5, returnDate: '2023-10-05' },
				{ id: 202, bookId: 3, userId: 2, returnDate: '2023-10-04' },
			],
		},
	})
	async getLastReturns(
		@User() user: IAuthUser,
	): Promise<IApiResponse<LoanEntity[]>> {
		const data = await this.analyticsService.getLastReturns(user);
		return {
			message: 'Last returns retrieved succesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
}
