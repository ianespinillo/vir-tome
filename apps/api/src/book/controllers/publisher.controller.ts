// src/publisher/controllers/publisher.controller.ts
import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guard/role.guard';
import { CurrentTenant } from '@/tenants/decorators/current-tenant.decorator';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreatePublisherDto, ROLES, UpdatePublisherDto } from '@repo/common';
import { PublisherEntity } from '../entities/publisher.entity';
import { PublisherService } from '../services/publisher.service';

@ApiTags('Editoriales')
@ApiBearerAuth()
@AuthBearer() // JWT + Multitenant guard
@ApiUnauthorizedResponse({
	description: 'No autorizado - Token inválido o faltante',
})
@ApiForbiddenResponse({
	description: 'Prohibido - Permisos insuficientes',
})
@Controller('publisher')
export class PublisherController {
	constructor(private readonly publisherService: PublisherService) {}

	@Post()
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Crear nueva editorial (Admin, Librarian)',
		description:
			'Registra una nueva editorial en el sistema. Requiere permisos de admin o bibliotecario.',
	})
	@ApiBody({
		type: CreatePublisherDto,
		description: 'Nombre de la editorial',
	})
	@ApiCreatedResponse({
		description: 'Editorial creada exitosamente',
	})
	@ApiBadRequestResponse({
		description: 'Datos inválidos o editorial ya existe',
	})
	async create(
		@CurrentTenant() tenant: TenantEntity,
		@Body() createDto: CreatePublisherDto,
	): Promise<PublisherEntity> {
		return this.publisherService.create(tenant.id, createDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Obtener listado de editoriales (All roles)',
		description:
			'Devuelve todas las editoriales. Todos los usuarios autenticados pueden acceder.',
	})
	@ApiOkResponse({
		description: 'Listado de editoriales',
	})
	async findAll(
		@CurrentTenant() tenant: TenantEntity,
	): Promise<PublisherEntity[]> {
		return this.publisherService.findAll(tenant.id);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener editorial por ID (All roles)',
		description:
			'Devuelve los datos de una editorial específica. Todos los usuarios pueden acceder.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la editorial',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Datos de la editorial',
	})
	@ApiNotFoundResponse({
		description: 'Editorial no encontrada',
	})
	async findOne(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
	): Promise<PublisherEntity | null> {
		return this.publisherService.findById(tenant.id, id);
	}

	@Patch(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Actualizar editorial (Admin, Librarian)',
		description:
			'Actualiza el nombre de una editorial. Requiere permisos de admin o bibliotecario.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la editorial a actualizar',
		example: 1,
		type: Number,
	})
	@ApiBody({
		type: UpdatePublisherDto,
		description: 'Nuevo nombre para la editorial',
	})
	@ApiNoContentResponse({
		description: 'Editorial actualizada exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Editorial no encontrada',
	})
	async update(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
		@Body() updateDto: UpdatePublisherDto,
	): Promise<void> {
		await this.publisherService.update(tenant.id, id, updateDto);
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar editorial (Admin only)',
		description:
			'Elimina una editorial del sistema. Solo posible si no tiene libros asociados. Requiere permisos de admin.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la editorial a eliminar',
		example: 1,
		type: Number,
	})
	@ApiNoContentResponse({
		description: 'Editorial eliminada exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Editorial no encontrada',
	})
	@ApiBadRequestResponse({
		description: 'No se puede eliminar - La editorial tiene libros asociados',
	})
	async remove(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
	): Promise<void> {
		await this.publisherService.delete(tenant.id, id);
	}
}
