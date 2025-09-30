import { PublisherEntity } from '@/book/entities/publisher.entity';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
// src/loans/services/loan.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateLoanDto, LoanStatus } from '@repo/common';
import { Repository, UpdateResult } from 'typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { BookService } from '../book/services/book.service';
import { LoanEntity } from './entities/loan.entity';
import { LoanService } from './loan.service';

describe('LoanService', () => {
	let loanService: LoanService;
	let loanRepository: Repository<LoanEntity>;
	let bookService: BookService;

	const mockLoanRepository = {
		find: jest.fn(),
		findOne: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		count: jest.fn(),
		findAndCount: jest.fn(),
		createQueryBuilder: jest.fn(),
		manager: {
			transaction: jest.fn(),
		},
	};

	const mockBookService = {
		findById: jest.fn(),
		removeStock: jest.fn(),
		updateStock: jest.fn(),
	};

	const tenantId = 1;
	const mockBook: BookEntity = {
		id: 1,
		tenant: { id: tenantId } as TenantEntity,
		title: 'Test Book',
		publicationYear: 2020,
		availableQuantity: 10,
		tenant_id: tenantId,
		created_at: new Date(),
		updated_at: new Date(),
		categories: [],
		publisher: {} as PublisherEntity,
		loans: [],
	};

	const mockLoan: LoanEntity = {
		id: 1,
		borrowerName: 'John Doe',
		book: mockBook,
		quantity: 2,
		loanDate: new Date('2024-01-01'),
		returnDate: new Date('2024-01-15'),
		status: LoanStatus.ACTIVE,
		created_at: new Date(),
		updated_at: new Date(),
		get tenant_id(): number {
			return this.book.tenant_id;
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LoanService,
				{
					provide: getRepositoryToken(LoanEntity),
					useValue: mockLoanRepository,
				},
				{
					provide: BookService,
					useValue: mockBookService,
				},
			],
		}).compile();

		loanService = module.get<LoanService>(LoanService);
		loanRepository = module.get<Repository<LoanEntity>>(
			getRepositoryToken(LoanEntity),
		);
		bookService = module.get<BookService>(BookService);

		jest.clearAllMocks();
	});

	describe('findAllByTenant', () => {
		it('should return all loans for a tenant', async () => {
			const loans = [mockLoan];
			mockLoanRepository.find.mockResolvedValue(loans);

			const result = await loanService.findAllByTenant(tenantId);

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: { book: { tenant_id: tenantId } },
				relations: ['book'],
			});
			expect(result).toEqual(loans);
		});

		it('should return empty array when no loans found', async () => {
			mockLoanRepository.find.mockResolvedValue([]);

			const result = await loanService.findAllByTenant(tenantId);

			expect(result).toEqual([]);
		});
	});

	describe('createLoan', () => {
		const createLoanDto: CreateLoanDto = {
			bookId: 1,
			borrowerName: 'John Doe',
			quantity: 2,
			returnDate: new Date('2024-01-15'),
		};

		it('should create a loan successfully', async () => {
			const futureDate = new Date(Date.now() + 86400000); // Tomorrow
			const dtoWithFutureDate = { ...createLoanDto, returnDate: futureDate };

			mockBookService.findById.mockResolvedValue({
				...mockBook,
				availableQuantity: 5,
			});
			mockLoanRepository.create.mockReturnValue(mockLoan);
			mockLoanRepository.manager.transaction.mockImplementation(
				async (callback) => {
					await callback(mockLoanRepository);
				},
			);
			mockLoanRepository.save.mockResolvedValue(mockLoan);

			const result = await loanService.createLoan(tenantId, dtoWithFutureDate);

			expect(bookService.findById).toHaveBeenCalledWith(
				tenantId,
				createLoanDto.bookId,
			);
			expect(bookService.removeStock).toHaveBeenCalledWith(
				tenantId,
				createLoanDto.bookId,
				createLoanDto.quantity,
			);
			expect(loanRepository.create).toHaveBeenCalledWith({
				...dtoWithFutureDate,
				loanDate: expect.any(Date),
				book: { id: createLoanDto.bookId },
			});
			expect(result).toEqual(mockLoan);
		});

		it('should throw NotFoundException when book not found', async () => {
			mockBookService.findById.mockResolvedValue(null);

			await expect(
				loanService.createLoan(tenantId, createLoanDto),
			).rejects.toThrow(NotFoundException);
		});

		it('should throw BadRequestException when return date is in the past', async () => {
			const pastDate = new Date('2020-01-01');
			const dtoWithPastDate = { ...createLoanDto, returnDate: pastDate };

			mockBookService.findById.mockResolvedValue(mockBook);

			await expect(
				loanService.createLoan(tenantId, dtoWithPastDate),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException when not enough books available', async () => {
			mockBookService.findById.mockResolvedValue({
				...mockBook,
				availableQuantity: 1,
			});

			await expect(
				loanService.createLoan(tenantId, createLoanDto),
			).rejects.toThrow(BadRequestException);
		});
		// Casos adicionales para el describe('createLoan')
		describe('createLoan edge cases', () => {
			it('should handle transaction rollback on error', async () => {
				const createLoanDto: CreateLoanDto = {
					bookId: 1,
					borrowerName: 'John Doe',
					quantity: 2,
					returnDate: new Date(Date.now() + 86400000),
				};

				mockBookService.findById.mockResolvedValue({
					...mockBook,
					availableQuantity: 5,
				});
				mockLoanRepository.create.mockReturnValue(mockLoan);

				// Simular error en la transacción
				mockLoanRepository.manager.transaction.mockRejectedValue(
					new Error('Database error'),
				);

				await expect(
					loanService.createLoan(tenantId, createLoanDto),
				).rejects.toThrow('Database error');
			});

			it('should handle zero quantity', async () => {
				const createLoanDto: CreateLoanDto = {
					bookId: 1,
					borrowerName: 'John Doe',
					quantity: 0,
					returnDate: new Date(Date.now() + 86400000),
				};

				mockBookService.findById.mockResolvedValue(mockBook);

				await expect(
					loanService.createLoan(tenantId, createLoanDto),
				).rejects.toThrow(BadRequestException);
			});
		});

		// Casos adicionales para el describe('returnBook')
		describe('returnBook edge cases', () => {
			it('should handle overdue loans', async () => {
				const overdueLoan = {
					...mockLoan,
					status: LoanStatus.ACTIVE,
					returnDate: new Date('2020-01-01'), // Fecha pasada
				};

				mockLoanRepository.findOne.mockResolvedValue(overdueLoan);
				mockBookService.findById.mockResolvedValue(mockBook);
				mockBookService.updateStock.mockResolvedValue(undefined);
				mockLoanRepository.update.mockResolvedValue({
					affected: 1,
					raw: {},
					generatedMaps: [],
				});

				const result = await loanService.returnBook(tenantId, 1);

				expect(result.affected).toBe(1);
				// Aunque esté vencido, debería permitir el retorno
			});
		});
	});

	describe('returnBook', () => {
		const mockUpdateResult: UpdateResult = {
			affected: 1,
			raw: {},
			generatedMaps: [],
		};

		it('should return book successfully', async () => {
			const loanToReturn = { ...mockLoan, status: LoanStatus.ACTIVE };
			mockLoanRepository.findOne.mockResolvedValue(loanToReturn);
			mockBookService.findById.mockResolvedValue(mockBook);
			mockBookService.updateStock.mockResolvedValue(undefined);
			mockLoanRepository.update.mockResolvedValue(mockUpdateResult);

			const result = await loanService.returnBook(tenantId, 1);

			expect(loanRepository.findOne).toHaveBeenCalledWith({
				where: { id: 1 },
				relations: ['book'],
			});
			expect(bookService.findById).toHaveBeenCalledWith(tenantId, mockBook.id);
			expect(bookService.updateStock).toHaveBeenCalledWith(
				tenantId,
				mockBook.id,
				loanToReturn.quantity,
			);
			expect(loanRepository.update).toHaveBeenCalledWith(1, {
				...loanToReturn,
				status: LoanStatus.RETURNED,
				returnDate: expect.any(Date),
			});
			expect(result).toEqual(mockUpdateResult);
		});

		it('should throw NotFoundException when loan not found', async () => {
			mockLoanRepository.findOne.mockResolvedValue(null);

			await expect(loanService.returnBook(tenantId, 999)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw NotFoundException when book not found', async () => {
			mockLoanRepository.findOne.mockResolvedValue(mockLoan);
			mockBookService.findById.mockResolvedValue(null);

			await expect(loanService.returnBook(tenantId, 1)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw BadRequestException when book already returned', async () => {
			const returnedLoan = { ...mockLoan, status: LoanStatus.RETURNED };
			mockLoanRepository.findOne.mockResolvedValue(returnedLoan);
			mockBookService.findById.mockResolvedValue(mockBook);

			await expect(loanService.returnBook(tenantId, 1)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('countLoans', () => {
		it('should return loan count for tenant', async () => {
			mockLoanRepository.count.mockResolvedValue(5);

			const result = await loanService.countLoans(tenantId);

			expect(loanRepository.count).toHaveBeenCalledWith({
				where: { book: { tenant_id: tenantId } },
			});
			expect(result).toEqual({ count: 5 });
		});

		it('should return zero when no loans', async () => {
			mockLoanRepository.count.mockResolvedValue(0);

			const result = await loanService.countLoans(tenantId);

			expect(result).toEqual({ count: 0 });
		});
	});

	describe('paginatedLoans', () => {
		it('should return paginated loans', async () => {
			const page = 1;
			const loans = [mockLoan];
			const total = 10;

			mockLoanRepository.findAndCount.mockResolvedValue([loans, total]);

			const result = await loanService.paginatedLoans(page, tenantId);

			expect(loanRepository.findAndCount).toHaveBeenCalledWith({
				relations: ['book'],
				where: { book: { tenant_id: tenantId } },
				order: { id: 'ASC' },
				take: 6,
				skip: 0,
			});
			expect(result).toEqual({
				data: loans.map((loan) => ({
					...loan,
					book: loan.book.title,
				})),
				total,
				current_page: page,
				last_page: Math.ceil(total / 6),
			});
		});
	});

	describe('mostLoanedBooks', () => {
		it('should return most loaned books', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([
					{ id: 1, title: 'Book 1', count: '5' },
					{ id: 2, title: 'Book 2', count: '3' },
				]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await loanService.mostLoanedBooks(5, tenantId);

			expect(mockLoanRepository.createQueryBuilder).toHaveBeenCalledWith('loan');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith('book.id', 'id');
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'book.title',
				'title',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('loan.book', 'book');
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'book.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('book.id');
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('count', 'DESC');
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
			expect(result).toHaveLength(2);
		});
	});

	describe('lastsLoans', () => {
		it('should return last loans', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getRawMany: jest
					.fn()
					.mockResolvedValue([{ id: 1, title: 'Book 1', loanDate: new Date() }]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await loanService.lastsLoans(tenantId);

			expect(mockLoanRepository.createQueryBuilder).toHaveBeenCalledWith('loan');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith('book.id', 'id');
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'book.title',
				'title',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'loan.loanDate',
				'loanDate',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'loan.returnDate',
				'returnDate',
			);
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('loan.book', 'book');
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'book.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
				'loan.loanDate',
				'DESC',
			);
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
			expect(result).toBeDefined();
		});
	});

	describe('getLastReturnedLoans', () => {
		it('should return last returned loans', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getRawMany: jest
					.fn()
					.mockResolvedValue([{ id: 1, title: 'Book 1', returnDate: new Date() }]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await loanService.getLastReturnedLoans(tenantId);

			expect(mockLoanRepository.createQueryBuilder).toHaveBeenCalledWith('loan');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith('book.id', 'id');
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'book.title',
				'title',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'loan.loanDate',
				'loanDate',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
				'loan.returnDate',
				'returnDate',
			);
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('loan.book', 'book');
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'book.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'loan.status = :status',
				{ status: LoanStatus.RETURNED },
			);
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
				'loan.returnDate',
				'DESC',
			);
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3);
			expect(result).toBeDefined();
		});
	});
});
