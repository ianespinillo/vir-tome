import { BookModule } from '@/book/book.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanEntity } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

@Module({
	controllers: [LoanController],
	providers: [LoanService],
	imports: [BookModule, TypeOrmModule.forFeature([LoanEntity])],
	exports: [LoanService],
})
export class LoanModule {}
