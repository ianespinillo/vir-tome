import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBookDto, UpdateBookDto } from '@repo/common';
import { GenericService } from 'src/core/generic.service';
import { Repository, IsNull } from 'typeorm';
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
        if (!categories || categories.length === 0) throw new BadRequestException('Categorías no encontradas');
        const publisher = await this.publishersService.findById( publisherId );
        if (!publisher) throw new NotFoundException('Editorial no encontrada');
        return this.bookRepository.save({
          ...bookData,
          categories,
          publisher
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
        if (book.availableQuantity < quantity) throw new BadRequestException('No hay suficientes ejemplares disponibles');
        book.availableQuantity -= quantity;
        await this.bookRepository.save(book);
    
      }
    
      async findAll(): Promise<BookEntity[]> {
        return this.bookRepository.findBy({deleted_at: IsNull()});
      }
    
      async findOne(id: number): Promise<BookEntity> {
        const book = await this.bookRepository.findOne({
          where: { id },
          relations: ['categories', 'publisher'],
        });
        if (!book) throw new NotFoundException('Libro no encontrado');
        return book;
      }
    
      async updateBook(id: number, updateBookDto: UpdateBookDto): Promise<BookEntity> {
        const book = await this.findOne(id);
        Object.assign(book, updateBookDto);
        await this.bookRepository.save(book);
        return book;
      }
    
      async remove(id: number): Promise<void> {
        await this.bookRepository.update(id,{ deleted_at: new Date() });
      }
}
