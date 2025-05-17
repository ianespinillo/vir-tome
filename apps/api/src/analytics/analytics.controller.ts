import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import {
	ApiOkResponse,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics') // Agrupa los endpoints en Swagger UI.
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
	getMostLoanedBooks(
		@Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
	) {
		return this.analyticsService.getMostLoanedBooks(limit);
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
	getLastLoans() {
		return this.analyticsService.getLastLoans();
	}

	@Get('count-books')
	@ApiOperation({ summary: 'Obtener el número total de libros' })
	@ApiOkResponse({
		description: 'Conteo de libros registrados',
		schema: {
			example: { count: 42 },
		},
	})
	async countBooks() {
		return this.analyticsService.countBooks();
	}

	@Get('count-loans')
	@ApiOperation({ summary: 'Obtener el número total de préstamos' })
	@ApiOkResponse({
		description: 'Conteo de préstamos registrados',
		schema: {
			example: { count: 150 },
		},
	})
	async countLoans() {
		return this.analyticsService.countLoans();
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
	async getLastReturns() {
		return this.analyticsService.getLastReturns();
	}
}
