import { BookService } from '@/book/services/book.service';
import { IAuthUser } from '@/core/core.types';
import { LoanService } from '@/loan/loan.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ROLES } from '@repo/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
	let service: AnalyticsService;
	const mockUser: Partial<IAuthUser> = {
		roleName: ROLES.ADMIN,
		tenantId: 1,
	};

	const mockBookService = {
		count: jest.fn().mockResolvedValue(42),
	} as const;

	const mockLoanService = {
		mostLoanedBooks: jest.fn().mockResolvedValue([
			{ id: 1, title: 'Book A', count: 5 }, // string count from DB
			{ id: 2, title: 'Book B', count: 3 },
		]),
		lastsLoans: jest
			.fn()
			.mockResolvedValue([
				{ id: 101, title: 'Book A', loanDate: '2023-10-01', returnDate: null },
			]),
		countLoans: jest.fn().mockResolvedValue({ count: 7 }),
		getLastReturnedLoans: jest.fn().mockResolvedValue([
			{
				id: 201,
				title: 'Book A',
				loanDate: '2023-10-01',
				returnDate: '2023-10-05',
			},
		]),
	} as const;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AnalyticsService,
				{ provide: BookService, useValue: mockBookService },
				{ provide: LoanService, useValue: mockLoanService },
			],
		}).compile();

		service = module.get<AnalyticsService>(AnalyticsService);
		jest.clearAllMocks();
	});

	describe('getMostLoanedBooks', () => {
		it('should pass limit and tenantId and coerce count to number', async () => {
			const limit = 3;
			const tenantId = 1;

			const result = await service.getMostLoanedBooks(
				limit,
				mockUser as IAuthUser,
			);

			expect(
				mockLoanService.mostLoanedBooks as unknown as jest.Mock,
			).toHaveBeenCalledTimes(1);
			expect(
				mockLoanService.mostLoanedBooks as unknown as jest.Mock,
			).toHaveBeenCalledWith(limit, tenantId);
			expect(result).toEqual([
				{ id: 1, title: 'Book A', count: 5 },
				{ id: 2, title: 'Book B', count: 3 },
			]);
			expect(typeof result[0].count).toBe('number');
		});

		it('should propagate errors from loanService', async () => {
			(
				mockLoanService.mostLoanedBooks as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			mockUser.tenantId = 9;
			await expect(
				service.getMostLoanedBooks(2, mockUser as IAuthUser),
			).rejects.toThrow('boom');
		});
	});

	describe('getLastLoans', () => {
		it('should call loanService with tenant id and return data', async () => {
			mockUser.tenantId = 10;
			const res = await service.getLastLoans(mockUser as IAuthUser);
			expect(
				mockLoanService.lastsLoans as unknown as jest.Mock,
			).toHaveBeenCalledWith(10);
			expect(res).toEqual([
				{ id: 101, title: 'Book A', loanDate: '2023-10-01', returnDate: null },
			]);
		});
	});

	describe('countBooks', () => {
		it('should return { count } to match controller docs', async () => {
			const res = await service.countBooks(mockUser as IAuthUser);
			expect(mockBookService.count as unknown as jest.Mock).toHaveBeenCalledTimes(
				1,
			);
			expect(res).toEqual(42);
		});
	});

	describe('countLoans', () => {
		it('should call loanService with tenant id and return its result', async () => {
			const res = await service.countLoans(mockUser as IAuthUser);
			expect(
				mockLoanService.countLoans as unknown as jest.Mock,
			).toHaveBeenCalledWith(mockUser.tenantId);
			expect(res).toEqual({ count: 7 });
		});
	});

	describe('getLastReturns', () => {
		it('should call loanService with tenant id and return its result', async () => {
			mockUser.roleName = ROLES.SUPER_ADMIN;
			const res = await service.getLastReturns(mockUser as IAuthUser);
			expect(
				mockLoanService.getLastReturnedLoans as unknown as jest.Mock,
			).toHaveBeenCalled();

			expect(res).toEqual([
				{
					id: 201,
					title: 'Book A',
					loanDate: '2023-10-01',
					returnDate: '2023-10-05',
				},
			]);
		});
	});
});
