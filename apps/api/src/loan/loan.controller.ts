import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
} from '@nestjs/swagger';
import { CreateLoanDto } from '@repo/common';
import { UpdateResult } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanService } from './loan.service';

@ApiTags('Préstamos')
@ApiBearerAuth()
@Controller('loan')
export class LoanController {
	constructor(private readonly loanService: LoanService) {}

	@Post()
	@ApiOperation({
		summary: 'Registrar nuevo préstamo',
		description: 'Crea un nuevo registro de préstamo de libro(s) a un usuario',
	})
	@ApiBody({
		type: CreateLoanDto,
		description: 'Datos del préstamo',
		examples: {
			prestamoNormal: {
				summary: 'Préstamo estándar',
				value: {
					borrowerName: 'Juan Pérez',
					bookId: 5,
					quantity: 1,
					returnDate: '2023-12-15',
				},
			},
			prestamoMultiple: {
				summary: 'Préstamo múltiple',
				value: {
					borrowerName: 'María García',
					bookId: 8,
					quantity: 3,
					returnDate: '2023-12-20',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Préstamo registrado exitosamente',
		type: LoanEntity,
		content: {
			'application/json': {
				examples: {
					prestamoCreado: {
						value: {
							id: 1,
							borrowerName: 'Juan Pérez',
							bookId: 5,
							quantity: 1,
							loanDate: '2023-11-10T10:00:00Z',
							returnDate: '2023-12-15T00:00:00Z',
							returned: false,
						},
					},
				},
			},
		},
	})
	@ApiBadRequestResponse({
		description: 'Datos inválidos o faltantes',
	})
	@ApiNotFoundResponse({
		description: 'Libro no encontrado',
	})
	@ApiConflictResponse({
		description: 'No hay suficientes ejemplares disponibles',
	})
	async createLoan(
		@Body() data: CreateLoanDto,
	): Promise<LoanEntity | LoanEntity[]> {
		return await this.loanService.create(data);
	}

	@Put('return/:id')
	@ApiOperation({
		summary: 'Registrar devolución',
		description: 'Marca un préstamo como devuelto en el sistema',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del préstamo',
		example: 1,
		type: Number,
	})
	@ApiNoContentResponse({
		description: 'Devolución registrada exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Préstamo no encontrado',
	})
	@ApiBadRequestResponse({
		description: 'El préstamo ya fue devuelto anteriormente',
	})
	async returnBook(
		@Param('id', ParseIntPipe) loanId: number,
	): Promise<UpdateResult> {
		return await this.loanService.returnBook(loanId);
	}

	@Get()
	@ApiOperation({
		summary: 'Listar préstamos',
		description: 'Obtiene un listado paginado de todos los préstamos registrados',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1)',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Listado de préstamos',
		content: {
			'application/json': {
				examples: {
					prestamosPaginados: {
						value: {
							data: [
								{
									id: 1,
									borrowerName: 'Juan Pérez',
									bookTitle: 'Cien años de soledad',
									quantity: 1,
									loanDate: '2023-11-01',
									returnDate: '2023-11-15',
									returned: false,
								},
								{
									id: 2,
									borrowerName: 'Ana López',
									bookTitle: 'El principito',
									quantity: 2,
									loanDate: '2023-11-05',
									returnDate: '2023-11-19',
									returned: true,
								},
							],
							meta: {
								total: 15,
								page: 1,
								lastPage: 3,
								perPage: 5,
							},
						},
					},
				},
			},
		},
	})
	async findAll(@Query('page') page = 1) {
		return await this.loanService.paginatedLoans(page);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener préstamo por ID',
		description: 'Obtiene los detalles completos de un préstamo específico',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del préstamo',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Detalles del préstamo',
		content: {
			'application/json': {
				examples: {
					prestamoDetallado: {
						value: {
							id: 1,
							borrowerName: 'Juan Pérez',
							bookId: 5,
							bookTitle: 'Cien años de soledad',
							bookAuthor: 'Gabriel García Márquez',
							quantity: 1,
							loanDate: '2023-11-10T10:00:00Z',
							returnDate: '2023-12-15T00:00:00Z',
							returned: false,
							returnedDate: null,
						},
					},
				},
			},
		},
	})
	@ApiNotFoundResponse({
		description: 'Préstamo no encontrado',
	})
	async findById(@Param('id', ParseIntPipe) id: number): Promise<LoanEntity> {
		return await this.loanService.findById(id);
	}
}
