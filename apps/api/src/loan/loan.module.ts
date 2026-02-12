import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookModule } from '../book/book.module';
import { UsersModule } from '../users/users.module';
import { LoanEntity } from './entities/loan.entity';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';

@Module({
	controllers: [LoanController],
	providers: [LoanService],
	imports: [BookModule, TypeOrmModule.forFeature([LoanEntity]), UsersModule],
	exports: [LoanService],
})
export class LoanModule {}
