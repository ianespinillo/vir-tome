import { GenericService } from '@/core/generic.service';
import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookDto, IBooKForm, UpdateBookDto } from '@repo/common';
import { IsNull, Repository, UpdateResult } from 'typeorm';
import { BookEntity } from '../entities/book.entity';
import { CategoryService } from './category.service';
import { PublisherService } from './publisher.service';

@Injectable()
export class BookService extends GenericService {
	constructor(
		@InjectRepository(BookEntity)
		private readonly bookRepository: Repository<BookEntity>,
		private readonly categoryService: CategoryService,
		private readonly publishersService: PublisherService,
	) {
		super(bookRepository);
	}

	async create(createBookDto: CreateBookDto): Promise<BookEntity> {
		const { categoryIds, publisherId, ...bookData } = createBookDto;
		const categories = await this.categoryService.findAllOfBook(categoryIds);
		if (!categories || categories.length === 0)
			throw new BadRequestException('Categorías no encontradas');
		const publisher = await this.publishersService.findById(publisherId);
		if (!publisher) throw new NotFoundException('Editorial no encontrada');
		return this.bookRepository.save({
			...bookData,
			categories,
			publisher,
		});
	}

	async updateStock(bookId: number, change: number): Promise<void> {
		const book = await this.bookRepository.findOneBy({ id: bookId });
		if (!book) throw new NotFoundException('Libro no encontrado');

		book.availableQuantity += change;
		await this.bookRepository.save(book);
	}
	async removeStock(bookId: number, quantity: number): Promise<void> {
		const book = await this.bookRepository.findOneBy({ id: bookId });
		if (!book) throw new NotFoundException('Libro no encontrado');
		if (book.availableQuantity < quantity)
			throw new BadRequestException('No hay suficientes ejemplares disponibles');
		book.availableQuantity -= quantity;
		await this.bookRepository.save(book);
	}

	async findAll(): Promise<BookEntity[]> {
		const books = await this.bookRepository.findBy({ deleted_at: IsNull() });
		const transformedBooks: any = [];
		for (const book of books) {
			const categories = await this.categoryService.findAllOfBook(
				book.categories.map((c) => c.id),
			);
			const publisher = await this.publishersService.findById(book.publisher.id);
			transformedBooks.push({
				...book,
				categories,
				publisher,
			});
		}
		return transformedBooks;
	}
	async findAllWithDetailsPaginated(page: number) {
		const [data, total] = await this.bookRepository.findAndCount({
			where: { deleted_at: IsNull() },
			relations: ['categories', 'publisher'],
			order: { id: 'ASC' },
			take: 10,
			skip: (page - 1) * 10,
		});
		return {
			data: data.map((book) => ({
				...book,
				categories: book.categories.map((category) => category.name).join(', '),
				publisher: book.publisher.name,
			})),
			total,
			current_page: page,
			last_page: Math.ceil(total / 10),
		};
	}
	async findOne(id: number): Promise<IBooKForm> {
		const book = await this.bookRepository.findOne({
			where: { id },
			relations: ['categories', 'publisher'],
		});
		if (!book) throw new NotFoundException('Libro no encontrado');
		return {
			id: book.id,
			title: book.title,
			publicationYear: book.publicationYear,
			categoriesIds: book.categories.flatMap((c) => c.id),
			availableQuantity: book.availableQuantity,
			publisherId: book.publisher.id,
		};
	}

	async updateBook(
		id: number,
		updateBookDto: UpdateBookDto,
	): Promise<BookEntity> {
		// 1. Obtener el libro existente con sus relaciones
		const book = await this.bookRepository.findOne({
			where: { id },
			relations: ['categories', 'publisher'],
		});

		if (!book) {
			throw new NotFoundException('Libro no encontrado');
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
					`Editorial con ID ${updateBookDto.publisherId} no encontrada`,
				);
			}

			book.publisher = publisher;
		}

		// 4. Manejar las categorías si vienen en el DTO
		if (updateBookDto.categoryIds) {
			const categories = await this.categoryService.findAllOfBook(
				updateBookDto.categoryIds,
			);
			book.categories = categories;
		}

		// 5. Guardar los cambios
		return await this.bookRepository.save(book);
	}

	async remove(id: number): Promise<UpdateResult> {
		return await this.bookRepository.update(id, { deleted_at: new Date() });
	}
}
