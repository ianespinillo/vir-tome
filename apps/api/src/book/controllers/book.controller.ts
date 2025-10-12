import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseBoolPipe,
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
	CreateBookDto,
	IBooKForm,
	ROLES,
	UpdateBookDto,
	UpdateStockDto,
} from '@repo/common';
// src/book/controllers/book.controller.ts
import { AuthBearer } from '../../auth/decorators/auth-bearer.decorators';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guard/role.guard';
import { CurrentTenant } from '../../tenants/decorators/current-tenant.decorator';
import { TenantEntity } from '../../tenants/entities/tenant.entity';
import { BookEntity } from '../entities/book.entity';
import { BookService } from '../services/book.service';

@ApiTags('Libros')
@ApiBearerAuth()
@AuthBearer() // JWT + Multitenant guard
@ApiUnauthorizedResponse({
	description: 'Unauthorized - Invalid or missing token',
})
@ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
@Controller('book')
export class BookController {
	constructor(private readonly bookService: BookService) {}

	@Post()
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Create a new book (Admin, Librarian, Teacher)',
		description:
			'Creates a new book entry in the system. Requires admin, librarian or teacher privileges.',
	})
	@ApiBody({
		type: CreateBookDto,
		description: 'Book creation data',
		examples: {
			basicBook: {
				summary: 'Basic book',
				value: {
					title: 'The Great Gatsby',
					author: 'F. Scott Fitzgerald',
					stock: 50,
					description:
						'A story of wealth, love, and the American Dream in the 1920s.',
				},
			},
		},
	})
	@ApiCreatedResponse({
		description: 'Book successfully created',
		type: BookEntity,
	})
	@ApiBadRequestResponse({ description: 'Bad Request - Invalid input data' })
	async create(
		@CurrentTenant() tenant: TenantEntity,
		@Body() createBookDto: CreateBookDto,
	): Promise<BookEntity> {
		return await this.bookService.createBook(tenant.id, createBookDto);
	}

	@Put('stock/:id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Update book stock (Admin, Librarian, Teacher)',
		description:
			'Updates the inventory stock for a specific book. Requires inventory manager or admin privileges.',
	})
	@ApiParam({
		name: 'id',
		description: 'Book ID',
		example: 1,
		type: Number,
	})
	@ApiBody({
		type: UpdateStockDto,
		description: 'Stock update data',
	})
	@ApiOkResponse({
		description: 'Stock successfully updated',
	})
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	async updateStock(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateStockDto,
	) {
		return this.bookService.updateStock(tenant.id, id, data.quantity);
	}

	@Put(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.TEACHER)
	@ApiOperation({
		summary: 'Update book details (Admin, Librarian, Teacher)',
		description:
			'Updates the details of a specific book. Requires admin, librarian or teacher privileges.',
	})
	@ApiParam({
		name: 'id',
		description: 'Book ID',
		example: 1,
		type: Number,
	})
	@ApiBody({
		type: UpdateBookDto,
		description: 'Book update data',
	})
	@ApiOkResponse({
		description: 'Book successfully updated',
		type: BookEntity,
	})
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	async updateBook(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateBookDto,
	) {
		return this.bookService.updateBook(tenant.id, id, data);
	}

	@Get()
	@ApiOperation({
		summary: 'Get paginated list of books (All roles)',
		description:
			'Retrieves a paginated list of all available books. All authenticated users can access.',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Page number (1-based)',
		example: 1,
		type: Number,
	})
	@ApiQuery({
		name: 'full',
		required: false,
		description: 'Get all books without pagination',
		example: false,
		type: Boolean,
	})
	@ApiQuery({
		name: 'search',
		required: false,
		description: 'Search books by title',
		type: String,
	})
	@ApiOkResponse({
		description: 'Paginated list of books',
	})
	async findAll(
		@CurrentTenant() tenant: TenantEntity,
		@Query('page', new ParseIntPipe({ optional: true })) page = 1,
		@Query('full', new ParseBoolPipe({ optional: true })) full = false,
		@Query('search') search?: string,
	) {
		if (full) {
			return this.bookService.findAll(tenant.id);
		}
		if (search) {
			return this.bookService.findBookByName(tenant.id, search);
		}
		return this.bookService.findAllWithDetailsPaginated(tenant.id, page);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get book by ID (All roles)',
		description:
			'Retrieves detailed information about a specific book. All authenticated users can access.',
	})
	@ApiParam({
		name: 'id',
		description: 'Book ID',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Book details',
		type: BookEntity,
	})
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	async findById(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
	): Promise<IBooKForm> {
		return await this.bookService.findOneBook(tenant.id, id);
	}

	@Delete(':id')
	@UseGuards(RolesGuard)
	@Roles(ROLES.ADMIN)
	@ApiOperation({
		summary: 'Delete a book (Admin only)',
		description:
			'Deletes a specific book from the system. Requires admin privileges.',
	})
	@ApiParam({
		name: 'id',
		description: 'Book ID',
		example: 1,
		type: Number,
	})
	@ApiNoContentResponse({ description: 'Book successfully deleted' })
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	async remove(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
	): Promise<void> {
		return await this.bookService.delete(tenant.id, id);
	}
}
