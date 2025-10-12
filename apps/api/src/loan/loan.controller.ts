// src/loan/loan.controller.ts
import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guard/role.guard';

import { CurrentUserId } from '@/auth/decorators/user.decorator';
import { CurrentTenant } from '@/tenants/decorators/current-tenant.decorator';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import {
	Body,
	Controller,
	Get,
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
import { CreateLoanDto, ROLES } from '@repo/common';
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
	@UseGuards(RolesGuard)
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
		@CurrentTenant() tenant: TenantEntity,
		@CurrentUserId() userId: number,
	): Promise<LoanEntity | LoanEntity[]> {
		return await this.loanService.createLoan(tenant.id, data, userId);
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
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) loanId: number,
	): Promise<UpdateResult> {
		return await this.loanService.returnBook(tenant.id, loanId);
	}

	@Get()
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
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
	async findAll(@CurrentTenant() tenant: TenantEntity, @Query('page') page = 1) {
		return await this.loanService.paginatedLoans(page, tenant.id);
	}

	@Get('my')
	@UseGuards(RolesGuard)
	@Roles(ROLES.STUDENT)
	@ApiOperation({
		summary: 'Mis préstamos (Student only)',
		description:
			'Obtiene los préstamos del estudiante autenticado. Solo para estudiantes.',
	})
	@ApiOkResponse({
		description: 'Préstamos del estudiante',
	})
	async getMyLoans(
		@CurrentTenant() tenant: TenantEntity,
		@CurrentUserId() userId: number,
	) {
		// TODO: Implementar método en LoanService
		return await this.loanService.findByUser(tenant.id, userId);
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
	async findById(@Param('id', ParseIntPipe) id: number): Promise<LoanEntity> {
		return await this.loanService.findById(id);
	}
}
