import { MultiTenantService } from '@/core/multi-tenant.service';
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	BooksQueriesDto,
	CreateBookDto,
	IPaginatedResponse,
	UpdateBookDto,
} from '@repo/common';
import { Between, FindOptionsWhere, ILike, In, MoreThan, Repository } from 'typeorm';
import { BookEntity } from '../entities/book.entity';
import { CategoryService } from '../services/category.service';
import { PublisherService } from './publisher.service';

@Injectable()
export class BookService extends MultiTenantService<BookEntity> {
	constructor(
		@InjectRepository(BookEntity)
		private readonly bookRepository: Repository<BookEntity>,
		private readonly categoryService: CategoryService,
		private readonly publishersService: PublisherService,
	) {
		super(bookRepository);
	}

	async createBook(
		tenantId: number,
		createBookDto: CreateBookDto,
	): Promise<BookEntity> {
		const { categoryIds, publisherId, ...bookData } = createBookDto;
		const categories =
			await this.categoryService.findCategoriesByIds(categoryIds);
		if (!categories || categories.length === 0)
			throw new BadRequestException('Categories not founded or empty');
		const publisher = await this.publishersService.findById(publisherId);
		if (!publisher) throw new NotFoundException('Publisher not founded');
		return this.create(tenantId, {
			tenant_id: tenantId,
			...bookData,
			categories,
			publisher,
		});
	}

	async updateStock(
		tenantId: number,
		bookId: number,
		change: number,
	): Promise<void> {
		const book = await this.findById(tenantId, bookId);
		if (!book) throw new NotFoundException('Book not founded');

		book.availableQuantity += change;
		await this.bookRepository.save(book);
	}
	async removeStock(
		tenantId: number,
		bookId: number,
		quantity: number,
	): Promise<void> {
		const book = await this.findById(tenantId, bookId);
		if (!book) throw new NotFoundException('Book not founded');
		if (book.availableQuantity < quantity)
			throw new BadRequestException('No enough stock available');
		book.availableQuantity -= quantity;
		await this.bookRepository.save(book);
	}

	async findAll(tenantId: number): Promise<BookEntity[]> {
		const books = await this.findBy(
			tenantId,
			{},
			{ relations: ['categories', 'publisher'] },
		);
		const transformedBooks: any = [];
		for (const book of books) {
			let categories: any = [];
			if (book.categories) {
				categories = await this.categoryService.findCategoriesByIds(
					book.categories.map((c) => c.id),
				);
			}
			const publisher = await this.publishersService.findById(book.publisher.id);
			transformedBooks.push({
				...book,
				categories,
				publisher,
			});
		}
		return transformedBooks;
	}
	async findAllWithDetailsPaginated(
    tenantId: number,
    query: BooksQueriesDto,
): Promise<IPaginatedResponse<BookEntity>> {
    const {
        page = 1,
        limit = 6,
        search,
        categoryIds,
        publisherId,
        minYear,
        maxYear,
        hasAvailableStock,
        minQuantity,
        maxQuantity,
    } = query;

    const where: FindOptionsWhere<BookEntity> = {
        ...(search && { title: ILike(`%${search}%`) }),
        ...(publisherId && { publisher: { id: publisherId } }),
        ...(categoryIds?.length && { categories: { id: In(categoryIds) } }),
        ...((minYear || maxYear) && {
            publicationYear: Between(
                minYear ?? 0, 
                maxYear ?? new Date().getFullYear() + 10
            ),
        }),
        ...(hasAvailableStock && { availableQuantity: MoreThan(0) }),
        ...((minQuantity !== undefined || maxQuantity !== undefined) && {
            availableQuantity: Between(
                minQuantity ?? 0, 
                maxQuantity ?? 999999
            ),
        }),
    };

    const [data, total] = await this.findAndCount(
        tenantId,
        where,
        {
            relations: ['categories', 'publisher'],
            order: { id: 'ASC' },
            take: limit,
            skip: (page - 1) * limit,
        },
    );

    return {
        items: data,
        meta: {
            current_page: page,
            last_page: Math.ceil(total / limit),
            per_page: limit,
            total,
        },
    };
}
	async findOneBook(tenantId: number, id: number): Promise<BookEntity> {
		const book = await this.findOne(
			tenantId,
			{
				id,
			},
			{
				relations: ['categories', 'publisher'],
			},
		);
		if (!book) throw new NotFoundException('Book not founded');
		return book;
	}

	async updateBook(
		tenantId: number,
		id: number,
		updateBookDto: UpdateBookDto,
	): Promise<BookEntity> {
		// 1. Obtener el libro existente con sus relaciones
		const book = await this.findOne(
			tenantId,
			{ id },
			{
				relations: ['categories', 'publisher'],
			},
		);

		if (!book) {
			throw new NotFoundException('Book not founded');
		}

		// 2. Actualizar propiedades simples
		Object.assign(book, {
			title: updateBookDto.title,
			publicationYear: updateBookDto.publicationYear,
			availableQuantity: updateBookDto.availableQuantity,
		});

		// 3. Manejar la relación con publisher si viene en el DTO
		if (updateBookDto.publisherId) {
			const publisher = await this.publishersService.findById(
				updateBookDto.publisherId,
			);

			if (!publisher) {
				throw new NotFoundException(
					`Publisher with ID ${updateBookDto.publisherId} not founded`,
				);
			}

			book.publisher = publisher;
		}

		// 4. Manejar las categorías si vienen en el DTO
		if (updateBookDto.categoryIds) {
			const categories = await this.categoryService.findCategoriesByIds(
				updateBookDto.categoryIds,
			);
			book.categories = categories;
		}

		// 5. Guardar los cambios
		return await this.bookRepository.save(book);
	}

	async findBookByName(tenantId: number, name: string) {
		const [data, total] = await this.findAndCount(
			tenantId,
			{
				title: ILike(`%${name}%`),
			},
			{
				relations: ['categories', 'publisher'],
				order: { id: 'ASC' },
			},
		);
		return {
			data,
			total,
			current_page: 1,
			last_page: Math.ceil(total / 6),
		};
	}
	async globalBooksCount() {
		return this.bookRepository.count();
	}
}
