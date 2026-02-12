import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
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
	BooksQueriesDto,
	CreateBookDto,
	IApiResponse,
	IPaginatedResponse,
	ROLES,
	UpdateBookDto,
	UpdateStockDto,
} from '@repo/common';
// src/book/controllers/book.controller.ts
import { AuthBearer } from '../../auth/decorators/auth-bearer.decorators';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { RolesGuard } from '../../auth/guard/role.guard';
import { IAuthUser } from '../../core/core.types';
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
		@User() user: IAuthUser,
		@Body() createBookDto: CreateBookDto,
	): Promise<IApiResponse<BookEntity>> {
		const data = await this.bookService.createBook(user.tenantId, createBookDto);
		return {
			message: 'Book created succesfully',
			data,
			timestamp: new Date().toISOString(),
			status: HttpStatus.CREATED,
		};
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
		@User() user: IAuthUser,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateStockDto,
	): Promise<IApiResponse<void>> {
		await this.bookService.updateStock(user.tenantId, id, data.quantity);
		return {
			message: 'Stock updated succesfully',
			data: null,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
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
		@User() user: IAuthUser,
		@Param('id', ParseIntPipe) id: number,
		@Body() data: UpdateBookDto,
	): Promise<IApiResponse<BookEntity>> {
		const res = await this.bookService.updateBook(user.tenantId, id, data);
		return {
			message: 'Book updated succesfully',
			data: res,
			timestamp: new Date().toISOString(),
			status: HttpStatus.OK,
		};
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
		@User() user: IAuthUser,
		@Query() queries: BooksQueriesDto,
	): Promise<
		IApiResponse<BookEntity[]> | IApiResponse<IPaginatedResponse<BookEntity>>
	> {
		const data = await this.bookService.findAllWithDetailsPaginated(
			user.tenantId,
			queries,
		);
		return {
			message: 'Books retrieved successfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
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
		@User() user: IAuthUser,
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<BookEntity>> {
		const data = await this.bookService.findOneBook(user.tenantId, id);
		return {
			message: 'Book founded succsesfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
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
		@User() user: IAuthUser,
		@Param('id', ParseIntPipe) id: number,
	): Promise<IApiResponse<void>> {
		await this.bookService.delete(user.tenantId, id);
		return {
			message: 'Book deleted successfully',
			data: null,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
}
