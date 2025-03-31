import { Module } from '@nestjs/common';
import { LoanService } from './loan.service';
import { LoanController } from './loan.controller';
import { BookModule } from '@/book/book.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanEntity } from './entities/loan.entity';

@Module({
  controllers: [LoanController],
  providers: [LoanService],
  imports: [BookModule, TypeOrmModule.forFeature([LoanEntity])],
})
export class LoanModule {}
