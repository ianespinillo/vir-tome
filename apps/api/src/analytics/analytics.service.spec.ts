import { BookService } from '@/book/services/book.service';
import { LoanService } from '@/loan/loan.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
	let service: AnalyticsService;

	const mockBookService = {
		count: jest.fn().mockResolvedValue(42),
	} as const;

	const mockLoanService = {
		mostLoanedBooks: jest.fn().mockResolvedValue([
			{ id: 1, title: 'Book A', count: '5' }, // string count from DB
			{ id: 2, title: 'Book B', count: '3' },
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

			const result = await service.getMostLoanedBooks(limit, tenantId);

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
			await expect(service.getMostLoanedBooks(2, 9)).rejects.toThrow('boom');
		});
	});

	describe('getLastLoans', () => {
		it('should call loanService with tenant id and return data', async () => {
			const res = await service.getLastLoans(10);
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
			const res = await service.countBooks(1);
			expect(mockBookService.count as unknown as jest.Mock).toHaveBeenCalledTimes(
				1,
			);
			expect(res).toEqual(42);
		});
	});

	describe('countLoans', () => {
		it('should call loanService with tenant id and return its result', async () => {
			const res = await service.countLoans(3);
			expect(
				mockLoanService.countLoans as unknown as jest.Mock,
			).toHaveBeenCalledWith(3);
			expect(res).toEqual({ count: 7 });
		});
	});

	describe('getLastReturns', () => {
		it('should call loanService with tenant id and return its result', async () => {
			const res = await service.getLastReturns(5);
			expect(
				mockLoanService.getLastReturnedLoans as unknown as jest.Mock,
			).toHaveBeenCalledWith(5);
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
