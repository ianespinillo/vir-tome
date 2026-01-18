import { PublisherEntity } from '@/book/entities/publisher.entity';
import { IAuthUser } from '@/core/core.types';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { UserEntity } from '@/users/entities/user.entity';
import { UsersService } from '@/users/services/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
	CreateLoanDto,
	ILoansQueries,
	IPaginatedResponse,
	LoanBorrowerType,
	LoanStatus,
	RequestLoanDTO,
} from '@repo/common';
import { Repository, UpdateResult } from 'typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { BookService } from '../book/services/book.service';
import { LoanEntity } from './entities/loan.entity';
import { LoanService } from './loan.service';

describe('LoanService', () => {
	let loanService: LoanService;
	let loanRepository: Repository<LoanEntity>;
	let bookService: BookService;
	let usersService: UsersService;

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

	const mockUsersService = {
		findById: jest.fn(),
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
	} as unknown as BookEntity;

	const mockUser: UserEntity = {
		id: 1,
		name: 'Test User',
		email: 'test@example.com',
	} as UserEntity;

	const mockLoan: LoanEntity = {
		id: 1,
		user_id: 1,
		user: mockUser,
		book: mockBook,
		book_id: mockBook.id,
		quantity: 2,
		loan_date: new Date('2026-01-01'),
		return_date: new Date('2026-01-15'),
		status: LoanStatus.ACTIVE,
		borrower_type: LoanBorrowerType.REGISTERED_USER,
		created_at: new Date(),
		updated_at: new Date(),
	} as unknown as LoanEntity;

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
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
			],
		}).compile();

		loanService = module.get<LoanService>(LoanService);
		loanRepository = module.get<Repository<LoanEntity>>(
			getRepositoryToken(LoanEntity),
		);
		bookService = module.get<BookService>(BookService);
		usersService = module.get<UsersService>(UsersService);

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
		describe('for registered users', () => {
			const createLoanDto: CreateLoanDto = {
				bookId: 1,
				quantity: 2,
				returnDate: new Date(Date.now() + 86400000),
				borrower_type: LoanBorrowerType.REGISTERED_USER,
				user_id: 1,
			};

			it('should create a loan successfully for registered user', async () => {
				mockBookService.findById.mockResolvedValue({
					...mockBook,
					availableQuantity: 5,
				});
				mockUsersService.findById.mockResolvedValue(mockUser);
				mockLoanRepository.create.mockReturnValue(mockLoan);
				mockLoanRepository.manager.transaction.mockImplementation(
					async (callback) => {
						await callback(mockLoanRepository);
					},
				);
				mockLoanRepository.save.mockResolvedValue(mockLoan);

				const result = await loanService.createLoan(tenantId, createLoanDto);

				expect(bookService.findById).toHaveBeenCalledWith(
					tenantId,
					createLoanDto.bookId,
				);
				expect(usersService.findById).toHaveBeenCalledWith(createLoanDto.user_id);
				expect(bookService.removeStock).toHaveBeenCalledWith(
					tenantId,
					createLoanDto.bookId,
					createLoanDto.quantity,
				);
				expect(loanRepository.create).toHaveBeenCalledWith({
					loan_date: expect.any(Date),
					book: { id: createLoanDto.bookId },
					quantity: createLoanDto.quantity,
					borrower_type: LoanBorrowerType.REGISTERED_USER,
					user_id: mockUser.id,
					status: LoanStatus.ACTIVE,
				});
				expect(result).toEqual(mockLoan);
			});

			it('should throw NotFoundException when user not found', async () => {
				mockBookService.findById.mockResolvedValue(mockBook);
				mockUsersService.findById.mockResolvedValue(null);

				await expect(
					loanService.createLoan(tenantId, createLoanDto),
				).rejects.toThrow(NotFoundException);
			});

			it('should throw BadRequestException when user_id is missing', async () => {
				const dtoWithoutUserId = {
					...createLoanDto,
					user_id: undefined,
				};
				mockBookService.findById.mockResolvedValue(mockBook);

				await expect(
					loanService.createLoan(tenantId, dtoWithoutUserId),
				).rejects.toThrow(BadRequestException);
			});
		});

		describe('for external borrowers', () => {
			const createExternalLoanDto: CreateLoanDto = {
				bookId: 1,
				quantity: 2,
				returnDate: new Date(Date.now() + 86400000),
				borrower_type: LoanBorrowerType.EXTERNAL_BORROWER,
				borrower_name: 'External User',
				borrower_email: 'external@example.com',
				borrower_phone: '123456789',
				borrower_national_id: 'ABC123',
			};

			it('should create a loan successfully for external borrower', async () => {
				const externalLoan = {
					...mockLoan,
					borrower_type: LoanBorrowerType.EXTERNAL_BORROWER,
					borrower_name: 'External User',
					borrower_email: 'external@example.com',
					borrower_phone: '123456789',
					borrower_national_id: 'ABC123',
					user_id: undefined,
				};

				mockBookService.findById.mockResolvedValue({
					...mockBook,
					availableQuantity: 5,
				});
				mockLoanRepository.create.mockReturnValue(externalLoan);
				mockLoanRepository.manager.transaction.mockImplementation(
					async (callback) => {
						await callback(mockLoanRepository);
					},
				);
				mockLoanRepository.save.mockResolvedValue(externalLoan);

				const result = await loanService.createLoan(
					tenantId,
					createExternalLoanDto,
				);

				expect(bookService.findById).toHaveBeenCalledWith(
					tenantId,
					createExternalLoanDto.bookId,
				);
				expect(bookService.removeStock).toHaveBeenCalledWith(
					tenantId,
					createExternalLoanDto.bookId,
					createExternalLoanDto.quantity,
				);
				expect(loanRepository.create).toHaveBeenCalledWith({
					bookId: createExternalLoanDto.bookId,
					quantity: createExternalLoanDto.quantity,
					returnDate: createExternalLoanDto.returnDate,
					borrower_type: LoanBorrowerType.EXTERNAL_BORROWER,
					borrower_name: createExternalLoanDto.borrower_name,
					borrower_email: createExternalLoanDto.borrower_email,
					borrower_phone: createExternalLoanDto.borrower_phone,
					borrower_national_id: createExternalLoanDto.borrower_national_id,
					loan_date: expect.any(Date),
					status: LoanStatus.ACTIVE,
				});
				expect(result).toEqual(externalLoan);
			});

			it('should throw BadRequestException when external borrower fields are missing', async () => {
				const incompleteDto = {
					...createExternalLoanDto,
					borrower_email: undefined,
				};
				mockBookService.findById.mockResolvedValue(mockBook);

				await expect(
					loanService.createLoan(tenantId, incompleteDto),
				).rejects.toThrow(BadRequestException);
			});
		});

		describe('common validations', () => {
			const createLoanDto: CreateLoanDto = {
				bookId: 1,
				quantity: 2,
				returnDate: new Date(Date.now() + 86400000),
				borrower_type: LoanBorrowerType.REGISTERED_USER,
				user_id: 1,
			};

			it('should throw NotFoundException when book not found', async () => {
				mockBookService.findById.mockResolvedValue(null);

				await expect(
					loanService.createLoan(tenantId, createLoanDto),
				).rejects.toThrow(NotFoundException);
			});

			it('should throw BadRequestException when quantity is zero', async () => {
				const dtoWithZeroQuantity = { ...createLoanDto, quantity: 0 };
				mockBookService.findById.mockResolvedValue(mockBook);

				await expect(
					loanService.createLoan(tenantId, dtoWithZeroQuantity),
				).rejects.toThrow(BadRequestException);
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

			it('should handle transaction rollback on error', async () => {
				mockBookService.findById.mockResolvedValue({
					...mockBook,
					availableQuantity: 5,
				});
				mockUsersService.findById.mockResolvedValue(mockUser);
				mockLoanRepository.create.mockReturnValue(mockLoan);

				mockLoanRepository.manager.transaction.mockRejectedValue(
					new Error('Database error'),
				);

				await expect(
					loanService.createLoan(tenantId, createLoanDto),
				).rejects.toThrow('Database error');
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
				return_date: expect.any(Date),
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

		it('should handle overdue loans', async () => {
			const overdueLoan = {
				...mockLoan,
				status: LoanStatus.ACTIVE,
				return_date: new Date('2020-01-01'),
			};

			mockLoanRepository.findOne.mockResolvedValue(overdueLoan);
			mockBookService.findById.mockResolvedValue(mockBook);
			mockBookService.updateStock.mockResolvedValue(undefined);
			mockLoanRepository.update.mockResolvedValue(mockUpdateResult);

			const result = await loanService.returnBook(tenantId, 1);

			expect(result.affected).toBe(1);
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

		it('should count all loans when no tenant specified', async () => {
			mockLoanRepository.count.mockResolvedValue(15);

			const result = await loanService.countLoans();

			expect(loanRepository.count).toHaveBeenCalledWith({
				where: {},
			});
			expect(result).toEqual({ count: 15 });
		});
	});

	describe('paginatedLoans', () => {
		const total = 10;
		const defaultLimit = 5;

		it('should return loans with correct metadata structure', async () => {
			const page = 1;
			const loans = [mockLoan];
			const queries = { page, limit: defaultLimit } as ILoansQueries;

			mockLoanRepository.findAndCount.mockResolvedValue([loans, total]);

			const result = await loanService.paginatedLoans(queries, tenantId);

			expect(loanRepository.findAndCount).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { book: { tenant_id: tenantId } },
					take: defaultLimit,
					skip: 0,
					order: { id: 'DESC' },
				}),
			);

			expect(result).toEqual({
				items: loans,
				meta: {
					per_page: defaultLimit,
					last_page: 2,
					total: total,
					current_page: page,
				},
			});
		});

		it('should apply correct skip for page 2', async () => {
			const page = 2;
			const queries = { page, limit: defaultLimit } as ILoansQueries;

			mockLoanRepository.findAndCount.mockResolvedValue([[], total]);

			await loanService.paginatedLoans(queries, tenantId);

			expect(loanRepository.findAndCount).toHaveBeenCalledWith(
				expect.objectContaining({
					skip: 5,
					take: defaultLimit,
				}),
			);
		});

		it('should include filters in the repository call', async () => {
			const queries = {
				search: 'Don Quijote',
				status: 'ACTIVE',
				limit: 10,
			} as ILoansQueries;

			mockLoanRepository.findAndCount.mockResolvedValue([[], 0]);

			await loanService.paginatedLoans(queries, tenantId);

			expect(loanRepository.findAndCount).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: 'ACTIVE',
						book: expect.objectContaining({
							tenant_id: tenantId,
							title: expect.anything(),
						}),
					}),
					take: 10,
				}),
			);
		});
	});

	describe('findByUser', () => {
		it('should return loans for specific user', async () => {
			const userId = 1;
			mockLoanRepository.find.mockResolvedValue([mockLoan]);

			const result = await loanService.findByUser(tenantId, userId);

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: {
					book: { tenant_id: tenantId },
					user_id: userId,
					deleted_at: expect.anything(),
				},
				relations: ['book', 'book.category', 'book.publisher', 'user'],
				order: { loan_date: 'DESC' },
			});
			expect(result).toEqual([mockLoan]);
		});
	});

	describe('mostLoanedBooks', () => {
		it('should return most loaned books', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockReturnThis(),
				addGroupBy: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([
					{ id: 1, title: 'Book 1', tenant_id: tenantId, count: 5 },
					{ id: 2, title: 'Book 2', tenant_id: tenantId, count: 3 },
				]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await loanService.mostLoanedBooks(5, tenantId);

			expect(mockLoanRepository.createQueryBuilder).toHaveBeenCalledWith('loan');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith([
				'book.id AS id',
				'book.title AS title',
				'book.tenant_id AS tenant_id',
				'COUNT(*)::int AS count',
			]);
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('loan.book', 'book');
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'book.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('book.id');
			expect(mockQueryBuilder.addGroupBy).toHaveBeenCalledWith('book.tenant_id');
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('count', 'DESC');
			expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
			expect(result).toHaveLength(2);
		});

		it('should work without tenant filter', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockReturnThis(),
				addGroupBy: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			await loanService.mostLoanedBooks(5);

			expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
		});
	});

	describe('lastsLoans', () => {
		it('should return last loans', async () => {
			mockLoanRepository.find.mockResolvedValue([mockLoan]);

			const result = await loanService.lastsLoans(tenantId);

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: { book: { tenant_id: tenantId } },
				relations: ['book', 'user'],
				order: { loan_date: 'desc' },
				take: 3,
			});
			expect(result).toEqual([mockLoan]);
		});

		it('should work without tenant filter', async () => {
			mockLoanRepository.find.mockResolvedValue([mockLoan]);

			await loanService.lastsLoans();

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: {},
				relations: ['book', 'user'],
				order: { loan_date: 'desc' },
				take: 3,
			});
		});
	});

	describe('getLastReturnedLoans', () => {
		it('should return last returned loans', async () => {
			const returnedLoan = { ...mockLoan, status: LoanStatus.RETURNED };
			mockLoanRepository.find.mockResolvedValue([returnedLoan]);

			const result = await loanService.getLastReturnedLoans(tenantId);

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: { book: { tenant_id: tenantId }, status: LoanStatus.RETURNED },
				relations: ['book'],
				order: { loan_date: 'desc' },
				take: 3,
			});
			expect(result).toEqual([returnedLoan]);
		});

		it('should work without tenant filter', async () => {
			mockLoanRepository.find.mockResolvedValue([]);

			await loanService.getLastReturnedLoans();

			expect(loanRepository.find).toHaveBeenCalledWith({
				where: { status: LoanStatus.RETURNED },
				relations: ['book'],
				order: { loan_date: 'desc' },
				take: 3,
			});
		});
	});

	describe('getLoansByMonth', () => {
		it('should return loans grouped by month', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([
					{ month: '2024-01', count: '5' },
					{ month: '2024-02', count: '3' },
				]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await loanService.getLoansByMonth(tenantId);

			expect(mockQueryBuilder.select).toHaveBeenCalledWith(
				"TO_CHAR(loan.loan_date, 'YYYY-MM')",
				'month',
			);
			expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('COUNT(*)', 'count');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('loan.book', 'book');
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'book.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('month');
			expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('month', 'ASC');
			expect(result).toHaveLength(2);
		});

		it('should work without tenant filter', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				addSelect: jest.fn().mockReturnThis(),
				innerJoin: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				groupBy: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([]),
			};

			mockLoanRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			await loanService.getLoansByMonth();

			expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
		});
	});
	describe('requestLoan', () => {
		const mock = {
			...mockLoan,
			status: LoanStatus.REQUESTED,
		};
		const user = {
			id: mockUser.id,
			tenantId: mockBook.tenant_id,
		} as IAuthUser;
		const futureDate = new Date(Date.now() + 86400000);
		const dto: RequestLoanDTO = {
			bookId: mockLoan.book_id,
			quantity: mockLoan.quantity,
			returnDate: futureDate,
		};
		it('should submit a loan request succesfully', async () => {
			mockBookService.findById.mockResolvedValue(mockBook);
			mockLoanRepository.save.mockResolvedValue(mock);
			const data = await loanService.requestLoan(dto, user);
			expect(data).toEqual(mock);
			expect(data.status).toEqual(LoanStatus.REQUESTED);
		});
		it('should throw error if book doesnt exist', async () => {
			mockBookService.findById.mockResolvedValue(null);
			await expect(loanService.requestLoan(dto, user)).rejects.toThrow(
				NotFoundException,
			);
		});
		it('should throw error if the returnDate is older than todeay', async () => {
			const oldDate = new Date(Date.now() - 86400000);
			mockBookService.findById.mockResolvedValue(mockBook);
			await expect(
				loanService.requestLoan({ ...dto, returnDate: oldDate }, user),
			).rejects.toThrow(BadRequestException);
		});
		it('should throw error if there is not many books available', async () => {
			mockBookService.findById.mockResolvedValue({
				...mockBook,
				availableQuantity: 1,
			});
			await expect(
				loanService.requestLoan({ ...dto, quantity: 2 }, user),
			).rejects.toThrow(BadRequestException);
		});
	});
	describe('getMyLoansByPage', () => {
		it('should return paginated loans', async () => {
			const myLoans = [mockLoan];
			mockLoanRepository.findAndCount.mockResolvedValue([myLoans, 1]);
			const result: IPaginatedResponse<LoanEntity> = {
				items: myLoans,
				meta: {
					per_page: 6,
					total: 1,
					current_page: 1,
					last_page: 1,
				},
			};
			const res = await loanService.getMyLoansByPage(1, 1);
			expect(res).toEqual(result);
		});
	});
});
