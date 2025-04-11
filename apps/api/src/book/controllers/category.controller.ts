import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
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
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto, UpdateCategoryDto } from '@repo/common';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';

@ApiTags('Categorias')
@ApiBearerAuth()
// @AuthBearer()
@ApiUnauthorizedResponse({
	description: 'Acceso no autorizado - Token inválido o faltante',
})
@ApiForbiddenResponse({ description: 'Prohibido - Permisos insuficientes' })
@Controller('category')
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Post()
	@ApiOperation({
		summary: 'Crear nueva categoría académica',
		description:
			'Crea una nueva categoría para clasificar libros (ej: Matemáticas, Lengua, Historia)',
	})
	@ApiBody({
		type: CreateCategoryDto,
		description: 'Datos para creación de categoría',
		examples: {
			matematica: {
				summary: 'Categoría Matemáticas',
				value: {
					name: 'Matemáticas',
					description:
						'Libros de álgebra, cálculo, geometría y matemáticas avanzadas',
				},
			},
			lengua: {
				summary: 'Categoría Lengua',
				value: {
					name: 'Lengua y Literatura',
					description:
						'Libros de gramática, literatura española y análisis lingüístico',
				},
			},
			historia: {
				summary: 'Categoría Historia',
				value: {
					name: 'Historia Universal',
					description:
						'Libros sobre historia mundial, civilizaciones y eventos históricos',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Categoría creada exitosamente',
		type: CategoryEntity,
		content: {
			'application/json': {
				examples: {
					matematica: {
						value: {
							id: 1,
							name: 'Matemáticas',
							description:
								'Libros de álgebra, cálculo, geometría y matemáticas avanzadas',
							createdAt: '2023-11-15T10:00:00Z',
						},
					},
				},
			},
		},
	})
	@ApiBadRequestResponse({
		description: 'Datos inválidos o categoría padre no existe',
	})
	async create(@Body() createDto: CreateCategoryDto): Promise<CategoryEntity> {
		return this.categoryService.createCategory(createDto);
	}

	@Get()
	@ApiOperation({
		summary: 'Obtener categorías académicas paginadas',
		description:
			'Obtiene listado de categorías para libros académicos con paginación',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1)',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Listado de categorías',
		content: {
			'application/json': {
				example: {
					data: [
						{
							id: 1,
							name: 'Matemáticas',
							bookCount: 45,
						},
						{
							id: 2,
							name: 'Lengua y Literatura',
							bookCount: 32,
						},
						{
							id: 3,
							name: 'Historia Universal',
							bookCount: 28,
						},
					],
					meta: {
						total: 3,
						page: 1,
						lastPage: 1,
						perPage: 10,
					},
				},
			},
		},
	})
	async findAll(@Query('page', ParseIntPipe) page = 1) {
		return this.categoryService.findByPage(page);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Obtener categoría específica',
		description: 'Obtiene los detalles completos de una categoría académica',
	})
	@ApiParam({
		name: 'id',
		description: 'ID de la categoría',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Detalles de la categoría',
		content: {
			'application/json': {
				examples: {
					matematica: {
						value: {
							id: 1,
							name: 'Matemáticas',
							description:
								'Libros de álgebra, cálculo, geometría y matemáticas avanzadas',
							bookCount: 45,
							subcategories: [
								{
									id: 4,
									name: 'Álgebra',
								},
								{
									id: 5,
									name: 'Geometría',
								},
							],
							createdAt: '2023-11-10T08:30:00Z',
							updatedAt: '2023-11-12T15:45:00Z',
						},
					},
				},
			},
		},
	})
	@ApiNotFoundResponse({ description: 'Categoría no encontrada' })
	async findOne(@Param('id') id: number): Promise<CategoryEntity | null> {
		return this.categoryService.findById(id);
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'Actualizar categoría',
		description: 'Actualiza los datos de una categoría académica existente',
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
		examples: {
			updateName: {
				summary: 'Actualizar nombre',
				value: {
					name: 'Matemáticas Avanzadas',
				},
			},
		},
	})
	@ApiNoContentResponse({ description: 'Categoría actualizada exitosamente' })
	@ApiNotFoundResponse({ description: 'Categoría no encontrada' })
	@ApiBadRequestResponse({ description: 'Datos inválidos' })
	async update(
		@Param('id') id: number,
		@Body() updateDto: UpdateCategoryDto,
	): Promise<void> {
		await this.categoryService.updateCategory(id, updateDto);
	}

	@Delete(':id')
	@ApiOperation({
		summary: 'Eliminar categoría',
		description:
			'Elimina una categoría académica (solo si no tiene libros asociados)',
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
	async remove(@Param('id') id: number): Promise<void> {
		await this.categoryService.delete(id);
	}
}
