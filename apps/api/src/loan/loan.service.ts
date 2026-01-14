import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoanEntity } from './entities/loan.entity';

import { BookEntity } from '@/book/entities/book.entity';
import { UsersService } from '@/users/services/users.service';
import {
	CreateLoanDto,
	LoanBorrowerType,
	LoanStatus,
	MostLoanedBooks,
} from '@repo/common';
import { IsNull, Repository, UpdateResult } from 'typeorm';
import { BookService } from '../book/services/book.service';
import { GenericService } from '../core/generic.service';

@Injectable()
export class LoanService extends GenericService {
	constructor(
		@InjectRepository(LoanEntity)
		private readonly loanRepository: Repository<LoanEntity>,
		private readonly bookService: BookService,
		private readonly usersService: UsersService,
	) {
		super(loanRepository);
	}
	async findAllByTenant(tenantId: number): Promise<LoanEntity[]> {
		return this.loanRepository.find({
			where: { book: { tenant_id: tenantId } },
			relations: ['book'],
		});
	}

	async createLoan(tenantId: number, data: CreateLoanDto) {
		const book = await this.bookService.findById(tenantId, data.bookId);
		if (!book) throw new NotFoundException('Book not found');
		if (data.quantity <= 0)
			throw new BadRequestException('Quantity must be greater than zero');
		if (new Date(Date.now()) > data.returnDate)
			throw new BadRequestException('Return date cannot be in the past');
		if (book.availableQuantity < data.quantity)
			throw new BadRequestException('Not enough books available');
		let loan: LoanEntity;
		switch (data.borrower_type) {
			case LoanBorrowerType.REGISTERED_USER:
				{
					if (!data.user_id)
						throw new BadRequestException('Invalid payload provided');
					const user = await this.usersService.findById(data.user_id);
					if (!user)
						throw new NotFoundException(`User with id ${data.user_id} not founded`);
					loan = this.loanRepository.create({
						loan_date: new Date(Date.now()),
						book: {
							id: data.bookId,
						},
						quantity: data.quantity,
						borrower_type: data.borrower_type,
						user_id: user.id,
					});
				}
				break;
			case LoanBorrowerType.EXTERNAL_BORROWER: {
				if (
					!data.borrower_email ||
					!data.borrower_name ||
					!data.borrower_national_id ||
					!data.borrower_phone
				)
					throw new BadRequestException('Invalid payload provided');
				const { user_id, ...rest } = data;
				loan = this.loanRepository.create({
					...rest,
					loan_date: new Date(Date.now()),
				});
				break;
			}
		}

		await this.loanRepository.manager.transaction(
			async (transactionalEntityManager) => {
				await this.bookService.removeStock(tenantId, data.bookId, data.quantity);
				await transactionalEntityManager.save(loan);
			},
		);
		return loan;
	}
	async returnBook(tenantId: number, loanId: number): Promise<UpdateResult> {
		const loan = await this.loanRepository.findOne({
			where: { id: loanId },
			relations: ['book'],
		});
		if (!loan) throw new NotFoundException('Loan not found');
		const book = await this.bookService.findById(tenantId, loan.book.id);
		if (!book) throw new NotFoundException('Book not found');
		if (loan.status === LoanStatus.RETURNED)
			throw new BadRequestException('Book already returned');
		await this.bookService.updateStock(tenantId, book.id, loan.quantity);
		loan.status = LoanStatus.RETURNED;
		loan.return_date = new Date(Date.now());
		return await this.update(loanId, loan);
	}
	//contar prestamos por tenant
	async countLoans(tenantId?: number) {
		const count = await this.loanRepository.count({
			where: tenantId ? { book: { tenant_id: tenantId } } : {},
		});

		return { count };
	}

	async paginatedLoans(page: number, tenantId: number) {
		const [data, total] = await this.loanRepository.findAndCount({
			relations: ['book'],
			where: { book: { tenant_id: tenantId } },
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
			current_page: Number(page),
			last_page: Math.ceil(total / 6),
		};
	}
	async findByUser(tenantId: number, userId: number) {
		return this.loanRepository.find({
			where: {
				book: {
					tenant_id: tenantId,
				},
				user_id: userId,
				deleted_at: IsNull(),
			},
			relations: ['book', 'book.category', 'book.publisher', 'user'],
			order: {
				loan_date: 'DESC',
			},
		});
	}
	async mostLoanedBooks(
		limit: number,
		tenantId?: number,
	): Promise<MostLoanedBooks[]> {
		const query = this.loanRepository
			.createQueryBuilder('loan')
			.select([
				'book.id AS id',
				'book.title AS title',
				'book.tenant_id AS tenant_id',
				'COUNT(*)::int AS count', // tipado correcto en PG
			])
			.innerJoin('loan.book', 'book')
			.groupBy('book.id')
			.addGroupBy('book.tenant_id')
			.orderBy('count', 'DESC')
			.limit(limit);

		if (tenantId) {
			query.andWhere('book.tenant_id = :tenantId', { tenantId });
		}

		return query.getRawMany();
	}

	async lastsLoans(tenantId?: number): Promise<LoanEntity[]> {
		return this.loanRepository.find({
			where: tenantId ? { book: { tenant_id: tenantId } } : {},
			relations: ['book', 'user'],
			order: { loan_date: 'desc' },
			take: 3,
		});
	}
	async getLastReturnedLoans(tenantId?: number) {
		return this.loanRepository.find({
			where: tenantId
				? { book: { tenant_id: tenantId }, status: LoanStatus.RETURNED }
				: { status: LoanStatus.RETURNED },
			relations: ['book'],
			order: { loan_date: 'desc' },
			take: 3,
		});
	}
	async getLoansByMonth(tenantId?: number) {
		const qb = this.loanRepository
			.createQueryBuilder('loan')
			.select("TO_CHAR(loan.loan_date, 'YYYY-MM')", 'month')
			.addSelect('COUNT(*)', 'count')
			.innerJoin('loan.book', 'book')
			.groupBy('month')
			.orderBy('month', 'ASC');

		if (tenantId)
			qb.andWhere('book.tenant_id = :tenantId', { tenantId: tenantId });
		return qb.getRawMany();
	}
}
