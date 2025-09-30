import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
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
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreatePublisherDto, UpdatePublisherDto } from '@repo/common';
import { PublisherEntity } from '../entities/publisher.entity';
import { PublisherService } from '../services/publisher.service';

@ApiTags('Editoriales')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
	description: 'No autorizado - Token inválido o faltante',
})
@ApiForbiddenResponse({
	description: 'Prohibido - Se requieren permisos de administrador',
})
@Controller('publisher')
export class PublisherController {
	constructor(private readonly publisherService: PublisherService) {}

	@Post()
	@ApiOperation({
		summary: 'Crear nueva editorial',
		description:
			'Registra una nueva editorial en el sistema con solo nombre. Requiere permisos de administrador.',
	})
	@ApiBody({
		type: CreatePublisherDto,
		description: 'Nombre de la editorial',
		examples: {
			santillana: {
				summary: 'Editorial Santillana',
				value: {
					name: 'Santillana',
				},
			},
			kapelusz: {
				summary: 'Editorial Kapelusz',
				value: {
					name: 'Kapelusz',
				},
			},
			estrada: {
				summary: 'Editorial Estrada',
				value: {
					name: 'Estrada',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Editorial creada exitosamente',
		schema: {
			example: {
				id: 1,
				name: 'Santillana',
			},
		},
	})
	@ApiBadRequestResponse({
		description: 'Datos inválidos o editorial ya existe',
		schema: {
			example: {
				message: 'El nombre de la editorial ya existe',
				error: 'Bad Request',
				statusCode: 400,
			},
		},
	})
	async create(
		@CurrentTenant() tenant: TenantEntity,
		@Body() createDto: CreatePublisherDto,
	): Promise<PublisherEntity> {
		return this.publisherService.create(tenant.id, createDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Obtener listado de editoriales',
		description: 'Devuelve todas las editoriales registradas en el sistema',
	})
	@ApiOkResponse({
		description: 'Listado de editoriales',
		schema: {
			example: [
				{
					id: 1,
					name: 'Santillana',
				},
				{
					id: 2,
					name: 'Kapelusz',
				},
				{
					id: 3,
					name: 'Estrada',
				},
			],
		},
	})
	async findAll(
		@CurrentTenant() tenant: TenantEntity,
	): Promise<PublisherEntity[]> {
		return this.publisherService.findAll(tenant.id);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener editorial por ID',
		description: 'Devuelve los datos de una editorial específica',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la editorial',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Datos de la editorial',
		schema: {
			example: {
				id: 1,
				name: 'Santillana',
			},
		},
	})
	@ApiNotFoundResponse({
		description: 'Editorial no encontrada',
		schema: {
			example: {
				message: 'Editorial con ID 999 no encontrada',
				error: 'Not Found',
				statusCode: 404,
			},
		},
	})
	async findOne(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
	): Promise<PublisherEntity | null> {
		return this.publisherService.findById(tenant.id, id);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Actualizar nombre de editorial',
		description: 'Actualiza el nombre de una editorial existente',
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
		examples: {
			rename: {
				summary: 'Renombrar editorial',
				value: {
					name: 'Santillana Argentina',
				},
			},
		},
	})
	@ApiNoContentResponse({
		description: 'Editorial actualizada exitosamente',
	})
	@ApiNotFoundResponse({
		description: 'Editorial no encontrada',
	})
	@ApiBadRequestResponse({
		description: 'Nombre inválido o ya existe',
	})
	async update(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
		@Body() updateDto: UpdatePublisherDto,
	): Promise<void> {
		await this.publisherService.update(tenant.id, id, updateDto);
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Eliminar editorial',
		description:
			'Elimina una editorial del sistema. Solo posible si no tiene libros asociados.',
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
		schema: {
			example: {
				message: 'No se puede eliminar la editorial porque tiene libros asociados',
				error: 'Bad Request',
				statusCode: 400,
			},
		},
	})
	async remove(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
	): Promise<void> {
		await this.publisherService.delete(tenant.id, id);
	}
}
