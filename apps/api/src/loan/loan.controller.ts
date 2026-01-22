// src/loan/loan.controller.ts
import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { Roles } from '@/auth/decorators/roles.decorator';
import { User } from '@/auth/decorators/user.decorator';
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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
  ILoanAlert,
  ILoanStatistics,
  IPaginatedResponse,
  LoanQueriesDTO,
  LoanStatus,
  ROLES,
  RequestLoanDTO,
  UpdateLoanStatusDTO,
} from '@repo/common';
import { UpdateResult } from 'typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanService } from './loan.service';

@ApiTags('Préstamos')
@ApiBearerAuth()
@AuthBearer()
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
  @ApiBody({ type: CreateLoanDto })
  @ApiCreatedResponse({ type: LoanEntity })
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
  })
  @ApiBody({ type: RequestLoanDTO })
  @ApiCreatedResponse({ type: LoanEntity })
  async requestLoan(
    @Body() dto: RequestLoanDTO,
    @User() user: IAuthUser,
  ): Promise<IApiResponse<LoanEntity>> {
    const data = await this.loanService.requestLoan(dto, user);
    return {
      data,
      message: 'Loan request submitted successfully',
      status: HttpStatus.CREATED,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('return/:id')
  @Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
  @ApiOperation({ summary: 'Registrar devolución (Admin, Librarian)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Devolución registrada exitosamente' })
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

  @Put(':id')
  @Roles(ROLES.LIBRARIAN)
  @ApiOperation({ summary: 'Actualizar estado de préstamo' })
  async updateLoanStatus(
    @Body() dto: UpdateLoanStatusDTO,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IApiResponse<LoanEntity>> {
    const data = await this.loanService.updateLoanStatus(dto.status, id);
    return {
      message: 'Loan status updated successfully',
      data,
      status: HttpStatus.OK,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // ENDPOINT UNIFICADO - Reemplaza findAll, getMyLoans, getLastRequests
  // ============================================
  @Get()
  @ApiOperation({
    summary: 'Listar préstamos con filtros avanzados',
    description: `
			Endpoint unificado para obtener préstamos con múltiples filtros.
			- Admins/Librarians: Pueden ver todos los préstamos o filtrar por usuario
			- Students/Teachers: Solo ven sus propios préstamos
			
			Ejemplos de uso:
			- Mis préstamos activos: ?onlyMyLoans=true&status=ACTIVE
			- Préstamos por vencer: ?dueSoon=true&dueSoonDays=7
			- Préstamos vencidos: ?isOverdue=true
			- Solicitudes pendientes: ?onlyPending=true
		`,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: LoanStatus })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'isOverdue', required: false, type: Boolean })
  @ApiQuery({ name: 'dueSoon', required: false, type: Boolean })
  @ApiQuery({ name: 'onlyMyLoans', required: false, type: Boolean })
  @ApiQuery({ name: 'onlyPending', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Listado de préstamos' })
  async findAll(
    @User() user: IAuthUser,
    @Query() queries: LoanQueriesDTO,
  ): Promise<IApiResponse<IPaginatedResponse<LoanEntity>>> {
    // Aplicar filtros según el rol del usuario
    const isAdminOrLibrarian = this.isAdminOrLibrarian(user);
    // Si no es admin/librarian, forzar que solo vea sus préstamos
    if (!isAdminOrLibrarian || queries.onlyMyLoans) {
      queries.userId = user.id;
    }

    const res = await this.loanService.paginatedLoans(queries, user.tenantId);

    return {
      message: 'Préstamos obtenidos exitosamente',
      data: res,
      status: HttpStatus.OK,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // ENDPOINTS DE ESTADÍSTICAS
  // ============================================
  @Get('statistics')
  @ApiOperation({
    summary: 'Obtener estadísticas de préstamos',
    description:
      'Retorna contadores de préstamos activos, por vencer, vencidos y devueltos',
  })
  @ApiOkResponse({
    description: 'Estadísticas de préstamos',
    schema: {
      example: {
        active: 8,
        dueSoon: 3,
        overdue: 1,
        returned: 12,
      },
    },
  })
  async getStatistics(
    @User() user: IAuthUser,
  ): Promise<IApiResponse<ILoanStatistics>> {
    const isAdminOrLibrarian = this.isAdminOrLibrarian(user);
    const userId = isAdminOrLibrarian ? undefined : user.id;
    const data = await this.loanService.getStatistics(user.tenantId, userId);

    return {
      message: 'Estadísticas obtenidas exitosamente',
      data,
      status: HttpStatus.OK,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Obtener alertas de préstamos',
    description:
      'Retorna alertas de préstamos vencidos, por vencer y otras notificaciones',
  })
  @ApiOkResponse({
    description: 'Alertas de préstamos',
  })
  async getAlerts(
    @User() user: IAuthUser,
  ): Promise<IApiResponse<ILoanAlert[]>> {
    const isAdminOrLibrarian = this.isAdminOrLibrarian(user);
    const userId = isAdminOrLibrarian ? undefined : user.id;

    const data = await this.loanService.getAlerts(user.tenantId, userId);

    return {
      message: 'Alertas obtenidas exitosamente',
      data,
      status: HttpStatus.OK,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalles del préstamo' })
  @ApiNotFoundResponse({ description: 'Préstamo no encontrado' })
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

  // ============================================
  // HELPERS
  // ============================================
  private isAdminOrLibrarian(user: IAuthUser): boolean {
    return user.roleName === ROLES.ADMIN || user.roleName === ROLES.LIBRARIAN;
  }
}
