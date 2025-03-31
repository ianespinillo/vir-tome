import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LoanEntity } from './entities/loan.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { BookService } from '../book/services/book.service';
import { CreateLoanDto, LoanStatus } from '@repo/common';
import { GenericService } from '../core/generic.service';

@Injectable()
export class LoanService extends GenericService {
    constructor(
        @InjectRepository(LoanEntity)
        private readonly loanRepository: Repository<LoanEntity>,
        private readonly bookService: BookService,
    ){
        super(loanRepository);
    }

    async create(data: CreateLoanDto) {
        const book = await this.bookService.findOne(data.bookId);
        if (!book) throw new NotFoundException('Book not found');
        if(book.availableQuantity < data.quantity) throw new BadRequestException('Not enough books available');
        const loan = this.loanRepository.create({
          ...data,
          book:{
            id: data.bookId
          }
        });
        return await this.loanRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(loan);
            await this.bookService.removeStock(data.bookId, data.quantity);
            return this.findById(loan[0].id);
        });
        
    }
    async returnBook(loanId: number): Promise<void> {
        const loan: LoanEntity = await this.findById(loanId);
        const book = await this.bookService.findOne(loan.book.id);
        book.availableQuantity += loan.quantity;
        await this.bookService.updateStock(book.id, book.availableQuantity);
        loan.status = LoanStatus.RETURNED;
        await this.update(loanId, loan);
    }

}
