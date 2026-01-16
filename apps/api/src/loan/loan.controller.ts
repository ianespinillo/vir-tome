// src/loan/loan.controller.ts
import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { Roles } from '@/auth/decorators/roles.decorator';
import { User } from '@/auth/decorators/user.decorator';
import { RolesGuard } from '@/auth/guard/role.guard';
import { IAuthUser } from '@/core/core.types';

import {
	Body,
	Controller,
	Get,
	HttpStatus,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
	CreateLoanDto,
	IApiResponse,
	IPaginatedResponse,
	ROLES,
	RequestLoanDTO,
	UpdateLoanStatusDTO,
} from '@repo/common';
import { UpdateResult } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanService } from './loan.service';

@ApiTags('Préstamos')
@ApiBearerAuth()
@AuthBearer() // JWT + Multitenant guard
@ApiUnauthorizedResponse({
	description: 'No autorizado - Token inválido o faltante',
})
@ApiForbiddenResponse({
	description: 'Prohibido - Permisos insuficientes',
})
@Controller('loan')
export class LoanController {
	constructor(private readonly loanService: LoanService) {}

	@Post()
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Registrar nuevo préstamo (Admin, Librarian)',
		description:
			'Crea un nuevo registro de préstamo de libro(s). Requiere permisos de admin o bibliotecario.',
	})
	@ApiBody({
		type: CreateLoanDto,
		description: 'Datos del préstamo',
	})
	@ApiCreatedResponse({
		description: 'Préstamo registrado exitosamente',
		type: LoanEntity,
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
		@User() user: IAuthUser,
	): Promise<IApiResponse<LoanEntity>> {
		const res = await this.loanService.createLoan(user.tenantId, data);
		return {
			message: 'Préstamo registrado exitosamente',
			data: res,
			status: HttpStatus.CREATED,
			timestamp: new Date().toISOString(),
		};
	}
	@Post('/request')
	@Roles(ROLES.STUDENT, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Registrar nuevo pedido de préstamo (Student, Teacher)',
		description:
			'Crea una nueva solicitus de préstamo de libro(s). Requiere permisos de estudiante o profesor.',
	})
	@ApiBody({
		type: RequestLoanDTO,
		description: 'Datos del préstamo',
	})
	@ApiCreatedResponse({
		description: 'Préstamo registrado exitosamente',
		type: LoanEntity,
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
	async requestLoan(
		@Body() dto: RequestLoanDTO,
		@User() user: IAuthUser,
	): Promise<IApiResponse<LoanEntity>> {
		const data = await this.loanService.requestLoan(dto, user);
		return {
			data,
			message: 'Loan reequest submitted succesfully',
			status: HttpStatus.CREATED,
			timestamp: new Date().toLocaleDateString(),
		};
	}

	@Put('return/:id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Registrar devolución (Admin, Librarian)',
		description:
			'Marca un préstamo como devuelto. Requiere permisos de admin o bibliotecario.',
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
		@User() user: IAuthUser,
		@Param('id', ParseIntPipe) loanId: number,
	): Promise<IApiResponse<UpdateResult>> {
		const res = await this.loanService.returnBook(user.tenantId, loanId);
		return {
			message: 'Devolución registrada exitosamente',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get()
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Listar préstamos (Admin, Librarian, Teacher)',
		description:
			'Obtiene un listado paginado de todos los préstamos. Requiere permisos de admin, bibliotecario o profesor.',
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
	})
	async findAll(
		@User() user: IAuthUser,
		@Query('page') page = 1,
	): Promise<IApiResponse<IPaginatedResponse<{ book: string } & LoanEntity>>> {
		const res = await this.loanService.paginatedLoans(page, user.tenantId);
		return {
			message: 'Préstamos obtenidos exitosamente',
			data: {
				items: res.data,
				meta: {
					total: res.total,
					current_page: res.current_page,
					last_page: res.last_page,
					per_page: 10,
				},
			} as IPaginatedResponse<{ book: string } & LoanEntity>,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get('my')
	@UseGuards(RolesGuard)
	@Roles(ROLES.STUDENT, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Mis préstamos (Student, Teacher only)',
		description:
			'Obtiene los préstamos del estudiante o profesor autenticado. Solo para estudiantes o profesores.',
	})
	@ApiOkResponse({
		description: 'Préstamos del estudiante',
	})
	async getMyLoans(
		@User() user: IAuthUser,
		@Param('page') page = 1,
	): Promise<IApiResponse<IPaginatedResponse<LoanEntity>>> {
		const res = await this.loanService.getMyLoansByPage(user.tenantId, page);
		return {
			message: 'Préstamos obtenidos exitosamente',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
	@Get('requests')
	@Roles(ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Ultimas solicitudes de prestamos',
		description: 'Obtiene las ultimas solicitudes de prestamos',
	})
	@ApiOkResponse({
		description: 'Prestamos del estudiante',
	})
	async getLastRequests(
		@Param('page', ParseIntPipe) page = 1,
	): Promise<IApiResponse<IPaginatedResponse<LoanEntity>>> {
		const data = await this.loanService.getLastRequests(page);
		return {
			message: 'Lasts requests retrieved succesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toLocaleDateString(),
		};
	}
	@Get(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Obtener préstamo por ID (Admin, Librarian, Teacher)',
		description:
			'Obtiene los detalles completos de un préstamo específico. Requiere permisos de admin, bibliotecario o profesor.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID del préstamo',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Detalles del préstamo',
	})
	@ApiNotFoundResponse({
		description: 'Préstamo no encontrado',
	})
	async findById(
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<LoanEntity>> {
		const res: LoanEntity = await this.loanService.findById(id);
		return {
			message: 'Préstamo obtenido exitosamente',
			data: res,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
	@Put(':id')
	@ApiOperation({
		summary: 'Actualizar estado de préstamo',
		description: 'Permite actualizar el estado del prestamo (Librarian only)',
	})
	@Roles(ROLES.LIBRARIAN)
	async updateLoanStatus(
		@Body() dto: UpdateLoanStatusDTO,
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<LoanEntity>> {
		const data = await this.loanService.updateLoanStatus(dto.status, id);
		return {
			message: 'Loan status updated succesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toLocaleDateString(),
		};
	}
}
