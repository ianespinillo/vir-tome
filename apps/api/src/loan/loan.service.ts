import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanEntity } from './entities/loan.entity';

import { CreateLoanDto, LoanStatus } from '@repo/common';
import { Repository, UpdateResult } from 'typeorm';
import { BookService } from '../book/services/book.service';
import { GenericService } from '../core/generic.service';

@Injectable()
export class LoanService extends GenericService {
	constructor(
		@InjectRepository(LoanEntity)
		private readonly loanRepository: Repository<LoanEntity>,
		private readonly bookService: BookService,
	) {
		super(loanRepository);
	}

	async create(data: CreateLoanDto) {
		const book = await this.bookService.findOne(data.bookId);
		if (!book) throw new NotFoundException('Book not found');
		if (new Date(Date.now()) > data.returnDate)
			throw new BadRequestException('Return date cannot be in the past');
		if (book.availableQuantity < data.quantity)
			throw new BadRequestException('Not enough books available');
		const loan = this.loanRepository.create({
			...data,
			loanDate: new Date(Date.now()),
			book: {
				id: data.bookId,
			},
		});
		await this.loanRepository.manager.transaction(
			async (transactionalEntityManager) => {
				await this.bookService.removeStock(data.bookId, data.quantity);
				await transactionalEntityManager.save(loan);
			},
		);
		return loan;
	}
	async returnBook(loanId: number): Promise<UpdateResult> {
		const loan = await this.loanRepository.findOne({
			where: { id: loanId },
			relations: ['book'],
		});
		if (!loan) throw new NotFoundException('Loan not found');
		const book = await this.bookService.findById(loan.book.id);
		await this.bookService.updateStock(book.id, loan.quantity);
		loan.status = LoanStatus.RETURNED;
		loan.returnDate = new Date(Date.now());
		return await this.update(loanId, loan);
	}

	async paginatedLoans(page: number) {
		const [data, total] = await this.loanRepository.findAndCount({
			relations: ['book'],
			order: { id: 'ASC' },
			take: 6,
			skip: (page - 1) * 6,
		});
		return {
			data: data.map((loan) => ({
				...loan,
				book: loan.book.title,
			})),
			total,
			current_page: page,
			last_page: Math.ceil(total / 6),
		};
	}
}
