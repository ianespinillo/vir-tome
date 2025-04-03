import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookController } from './controllers/book.controller';
import { CategoryController } from './controllers/category.controller';
import { PublisherController } from './controllers/publisher.controller';
import { BookEntity } from './entities/book.entity';
import { CategoryEntity } from './entities/category.entity';
import { PublisherEntity } from './entities/publisher.entity';
import { BookService } from './services/book.service';
import { CategoryService } from './services/category.service';
import { PublisherService } from './services/publisher.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([BookEntity, CategoryEntity, PublisherEntity]),
	],
	providers: [BookService, CategoryService, PublisherService],
	controllers: [CategoryController, BookController, PublisherController],
	exports: [BookService],
})
export class BookModule {}
