// src/category/controllers/category.controller.ts
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
	ApiQuery,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
	CreateCategoryDto,
	IApiResponse,
	IPaginatedResponse,
	ROLES,
	UpdateCategoryDto,
} from '@repo/common';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';

@ApiTags('Categorias')
@ApiBearerAuth()
@AuthBearer() // JWT + Multitenant guard
@ApiUnauthorizedResponse({
	description: 'Acceso no autorizado - Token inválido o faltante',
})
@ApiForbiddenResponse({ description: 'Prohibido - Permisos insuficientes' })
@Controller('categories')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Post()
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Crear nueva categoría (Admin, Librarian)',
		description:
			'Crea una nueva categoría para clasificar libros. Requiere permisos de admin o bibliotecario.',
	})
	@ApiBody({
		type: CreateCategoryDto,
		description: 'Datos para creación de categoría',
	})
	@ApiCreatedResponse({
		description: 'Categoría creada exitosamente',
		type: CategoryEntity,
	})
	@ApiBadRequestResponse({
		description: 'Datos inválidos o categoría padre no existe',
	})
	async create(
		@CurrentTenant() tenant: TenantEntity,
		@Body() createDto: CreateCategoryDto,
	): Promise<IApiResponse<CategoryEntity>> {
		const data = await this.categoryService.create(tenant.id, createDto);
		return {
			message: 'Categoría creada exitosamente',
			data,
			status: HttpStatus.CREATED,
			timestamp: new Date().toISOString(),
		};
	}

	@Get()
	@ApiOperation({
		summary: 'Obtener categorías (All roles)',
		description:
			'Obtiene listado de categorías. Todos los usuarios autenticados pueden acceder.',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1)',
		example: 1,
		type: Number,
	})
	@ApiQuery({
		name: 'full',
		required: false,
		description: 'Obtener todas sin paginación',
		example: false,
		type: Boolean,
	})
	@ApiOkResponse({
		description: 'Listado de categorías',
	})
	async findAll(
		@CurrentTenant() tenant: TenantEntity,
		@Query('page', new ParseIntPipe({ optional: true })) page = 1,
		@Query('full', new ParseBoolPipe({ optional: true })) full = false,
	): Promise<
		| IApiResponse<CategoryEntity[]>
		| IApiResponse<IPaginatedResponse<CategoryEntity>>
	> {
		if (full) {
			const data = await this.categoryService.findAll(tenant.id);
			return {
				message: 'Categorías obtenidas exitosamente',
				data,
				status: HttpStatus.OK,
				timestamp: new Date().toISOString(),
			};
		}
		const data = await this.categoryService.findByPage(tenant.id, page);
		return {
			message: 'Categorías obtenidas exitosamente',
			data: {
				items: data.data,
				meta: {
					total: data.total,
					current_page: data.current_page,
					last_page: data.last_page,
					per_page: 10,
				},
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener categoría específica (All roles)',
		description:
			'Obtiene los detalles completos de una categoría. Todos los usuarios pueden acceder.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la categoría',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Detalles de la categoría',
	})
	@ApiNotFoundResponse({ description: 'Categoría no encontrada' })
	async findOne(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<CategoryEntity | null>> {
		const data = await this.categoryService.findById(tenant.id, id);
		return {
			message: 'Categoría obtenida exitosamente',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Patch(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN)
	@ApiOperation({
		summary: 'Actualizar categoría (Admin, Librarian)',
		description:
			'Actualiza los datos de una categoría. Requiere permisos de admin o bibliotecario.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la categoría a actualizar',
		example: 1,
		type: Number,
	})
	@ApiBody({
		type: UpdateCategoryDto,
		description: 'Datos de actualización',
	})
	@ApiNoContentResponse({ description: 'Categoría actualizada exitosamente' })
	@ApiNotFoundResponse({ description: 'Categoría no encontrada' })
	async update(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
		@Body() updateDto: UpdateCategoryDto,
	): Promise<IApiResponse<void>> {
		await this.categoryService.update(tenant.id, id, updateDto);
		return {
			message: 'Categoría actualizada exitosamente',
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
			data: null,
		};
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Eliminar categoría (Admin only)',
		description:
			'Elimina una categoría (solo si no tiene libros asociados). Requiere permisos de admin.',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la categoría a eliminar',
		example: 1,
		type: Number,
	})
	@ApiNoContentResponse({ description: 'Categoría eliminada exitosamente' })
	@ApiNotFoundResponse({ description: 'Categoría no encontrada' })
	@ApiBadRequestResponse({
		description: 'No se puede eliminar - La categoría tiene libros asociados',
	})
	async remove(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id') id: number,
	): Promise<IApiResponse<void>> {
		await this.categoryService.delete(tenant.id, id);
		return {
			message: 'Categoría eliminada exitosamente',
			data: null,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
}
