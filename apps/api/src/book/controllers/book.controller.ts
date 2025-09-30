import { AuthBearer } from '@/auth/decorators/auth-bearer.decorators';
import { CurrentTenant } from '@/tenants/decorators/current-tenant.decorator';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
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
import {
	CreateBookDto,
	IBooKForm,
	UpdateBookDto,
	UpdateStockDto,
} from '@repo/common';
import { UpdateResult } from 'typeorm';
import { BookEntity } from '../entities/book.entity';
import { BookService } from '../services/book.service';

@ApiTags('Libros')
// @ApiBearerAuth()
@ApiUnauthorizedResponse({
	description: 'Unauthorized - Invalid or missing token',
})
@ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' })
@Controller('book')
export class BookController {
	constructor(private readonly bookService: BookService) {}

	@Post()
	@ApiOperation({
		summary: 'Create a new book',
		description:
			'Creates a new book entry in the system. Requires admin privileges.',
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
			technicalBook: {
				summary: 'Technical book',
				value: {
					title: 'Clean Code',
					author: 'Robert C. Martin',
					stock: 30,
					description: 'A handbook of agile software craftsmanship.',
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
	@ApiOperation({
		summary: 'Update book stock',
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
		examples: {
			increaseStock: {
				summary: 'Increase stock',
				value: { quantity: 10 },
			},
			decreaseStock: {
				summary: 'Decrease stock',
				value: { quantity: -5 },
			},
		},
	})
	@ApiOkResponse({
		description: 'Stock successfully updated',
		schema: {
			example: {
				id: 1,
				title: 'The Great Gatsby',
				stock: 60,
				previousStock: 50,
			},
		},
	})
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	@ApiBadRequestResponse({
		description: 'Bad Request - Invalid quantity or insufficient stock',
	})
	async updateStock(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateStockDto,
	) {
		return this.bookService.updateStock(tenant.id, id, data.quantity);
	}

	@Put(':id')
	@ApiOperation({
		summary: 'Update book details',
		description:
			'Updates the details of a specific book. Requires admin privileges.',
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
		examples: {
			updateTitle: {
				summary: 'Update title',
				value: {
					title: 'The Great Gatsby - Special Edition',
				},
			},
			fullUpdate: {
				summary: 'Full update',
				value: {
					title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
					author: 'Robert C. Martin (Uncle Bob)',
					description: 'Updated edition with new examples',
				},
			},
		},
	})
	@ApiOkResponse({
		description: 'Book successfully updated',
		type: BookEntity,
	})
	@ApiNotFoundResponse({
		description: 'Not Found - Book with specified ID not found',
	})
	@ApiBadRequestResponse({ description: 'Bad Request - Invalid input data' })
	async updateBook(
		@CurrentTenant() tenant: TenantEntity,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateBookDto,
	) {
		return this.bookService.updateBook(tenant.id, id, data);
	}

	@Get()
	@ApiOperation({
		summary: 'Get paginated list of books',
		description:
			'Retrieves a paginated list of all available books. Default page is 1.',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Page number (1-based)',
		example: 1,
		type: Number,
	})
	@ApiOkResponse({
		description: 'Paginated list of books',
		schema: {
			example: {
				data: [
					{
						id: 1,
						title: 'The Great Gatsby',
						author: 'F. Scott Fitzgerald',
						stock: 50,
					},
					{
						id: 2,
						title: 'Clean Code',
						author: 'Robert C. Martin',
						stock: 30,
					},
				],
				meta: {
					total: 2,
					page: 1,
					lastPage: 1,
					perPage: 10,
				},
			},
		},
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
		return this.bookService.findByPage(tenant.id, page);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get book by ID',
		description: 'Retrieves detailed information about a specific book.',
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
	@ApiOperation({
		summary: 'Delete a book',
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
