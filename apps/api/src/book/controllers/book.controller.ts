import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { CreateBookDto, UpdateBookDto, UpdateStockDto } from '@repo/common';
;
import { BookEntity } from '../entities/book.entity';
import { BookService } from '../services/book.service';
import { AuthBearer } from 'src/auth/decorators/auth-bearer.decorators';

@AuthBearer()
@Controller('book')
export class BookController {
    constructor(private readonly bookService: BookService) {}

    @Post()
    async create(@Body() createBookDto: CreateBookDto): Promise<BookEntity> {
        return await this.bookService.create(createBookDto);
    }

    @Put('stock/:id')  // PUT /books/stock/1
    async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStockDto,
    ) {
    return this.bookService.updateStock(id, data.quantity);
    }

    @Put(':id')  // PUT /books/1
    async updateBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBookDto,
    ) {
    return this.bookService.update(id, data);
    }

    @Get()
    async findAll(@Query('page', ParseIntPipe) page: number = 1) {
        return await this.bookService.findByPage(page);
    }

    @Get(':id')
    async findById(@Param('id', ParseIntPipe) id: number): Promise<BookEntity> {
        return await this.bookService.findOne(id);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.bookService.remove(id);
    }
}
