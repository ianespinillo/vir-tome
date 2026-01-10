// src/publisher/controllers/publisher.controller.ts
import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guard/role.guard';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	ParseBoolPipe,
	ParseIntPipe,
	Patch,
	Post,
	Query,
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
import {
	CreatePublisherDto,
	IApiResponse,
	IPaginatedResponse,
	ROLES,
	UpdatePublisherDto,
} from '@repo/common';
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
		@Body() createDto: CreatePublisherDto,
	): Promise<IApiResponse<PublisherEntity>> {
		const data = await this.publisherService.createPublisher(createDto);
		return {
			message: 'Editorial creada exitosamente',
			data,
			status: HttpStatus.CREATED,
			timestamp: new Date().toISOString(),
		};
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
		@Query('page', new ParseIntPipe({ optional: true })) page = 1,
		@Query('full', new ParseBoolPipe({ optional: true })) full = false,
		@Query('q') q?: string,
	): Promise<
		IApiResponse<PublisherEntity[] | IPaginatedResponse<PublisherEntity>>
	> {
		if (full) {
			const data = await this.publisherService.findAll();
			return {
				message: 'Editoriales obtenidas exitosamente',
				data,
				status: HttpStatus.OK,
				timestamp: new Date().toISOString(),
			};
		}
		const data = await this.publisherService.getPaginated(page, q);
		return {
			message: 'Editoriales obtenidas exitosamente',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
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
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<PublisherEntity | null>> {
		const data = await this.publisherService.findById(id);
		return {
			message: 'Editorial obtenida exitosamente',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
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
		@Param('id') id: number,
		@Body() updateDto: UpdatePublisherDto,
	): Promise<IApiResponse<void>> {
		await this.publisherService.update(id, updateDto);
		return {
			message: 'Editorial actualizada exitosamente',
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
			data: null,
		};
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
	async remove(@Param('id') id: number): Promise<IApiResponse<void>> {
		await this.publisherService.delete(id);
		return {
			message: 'Editorial eliminada exitosamente',
			data: null,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
}
