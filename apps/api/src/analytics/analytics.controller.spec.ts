import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
	let controller: AnalyticsController;

	const mockAnalyticsService = {
		getMostLoanedBooks: jest.fn().mockResolvedValue([
			{ id: 1, title: 'Book A', count: 12 },
			{ id: 2, title: 'Book B', count: 9 },
		]),
		getLastLoans: jest
			.fn()
			.mockResolvedValue([{ id: 101, bookId: 1, userId: 5, date: '2023-10-01' }]),
		countBooks: jest.fn().mockResolvedValue({ count: 42 }),
		countLoans: jest.fn().mockResolvedValue({ count: 7 }),
		getLastReturns: jest
			.fn()
			.mockResolvedValue([
				{ id: 201, bookId: 1, userId: 5, returnDate: '2023-10-05' },
			]),
	} as const;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AnalyticsController],
			providers: [
				{
					provide: AnalyticsService,
					useValue: mockAnalyticsService,
				},
			],
		}).compile();

		controller = module.get<AnalyticsController>(AnalyticsController);

		// Reset calls between tests
		jest.clearAllMocks();
	});

	describe('getMostLoanedBooks', () => {
		it('should pass default limit=5 and tenant id to service', async () => {
			const tenant = { id: 1 } as any;

			const result = await controller.getMostLoanedBooks(tenant);

			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledWith(5, 1);
			expect(result).toEqual([
				{ id: 1, title: 'Book A', count: 12 },
				{ id: 2, title: 'Book B', count: 9 },
			]);
		});

		it('should honor provided limit and pass tenant id', async () => {
			const tenant = { id: 2 } as any;

			await controller.getMostLoanedBooks(tenant, 3);

			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledWith(3, 2);
		});
	});

	describe('getLastLoans', () => {
		it('should call service with tenant id', async () => {
			const tenant = { id: 10 } as any;

			const result = await controller.getLastLoans(tenant);

			expect(mockAnalyticsService.getLastLoans).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getLastLoans).toHaveBeenCalledWith(10);
			expect(result).toEqual([
				{ id: 101, bookId: 1, userId: 5, date: '2023-10-01' },
			]);
		});
	});

	describe('countBooks', () => {
		it('should call service without params and return its result', async () => {
			const result = await controller.countBooks({ id: 1 } as TenantEntity);

			expect(mockAnalyticsService.countBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.countBooks).toHaveBeenCalledWith(1);
			expect(result).toEqual({ count: 42 });
		});
	});

	describe('countLoans', () => {
		it('should call service with tenant id', async () => {
			const tenant = { id: 3 } as any;

			const result = await controller.countLoans(tenant);

			expect(mockAnalyticsService.countLoans).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.countLoans).toHaveBeenCalledWith(3);
			expect(result).toEqual({ count: 7 });
		});
	});

	describe('getLastReturns', () => {
		it('should call service with tenant id', async () => {
			const tenant = { id: 5 } as any;

			const result = await controller.getLastReturns(tenant);

			expect(mockAnalyticsService.getLastReturns).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getLastReturns).toHaveBeenCalledWith(5);
			expect(result).toEqual([
				{ id: 201, bookId: 1, userId: 5, returnDate: '2023-10-05' },
			]);
		});
	});

	describe('unhappy paths (error propagation)', () => {
		it('getMostLoanedBooks should propagate service errors', async () => {
			const tenant = { id: 1 } as any;
			(
				mockAnalyticsService.getMostLoanedBooks as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.getMostLoanedBooks(tenant)).rejects.toThrow('boom');
		});

		it('getLastLoans should propagate service errors', async () => {
			const tenant = { id: 2 } as any;
			(
				mockAnalyticsService.getLastLoans as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.getLastLoans(tenant)).rejects.toThrow('boom');
		});

		it('countBooks should propagate service errors', async () => {
			(
				mockAnalyticsService.countBooks as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(
				controller.countBooks({ id: 1 } as TenantEntity),
			).rejects.toThrow('boom');
		});

		it('countLoans should propagate service errors', async () => {
			const tenant = { id: 3 } as any;
			(
				mockAnalyticsService.countLoans as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.countLoans(tenant)).rejects.toThrow('boom');
		});

		it('getLastReturns should propagate service errors', async () => {
			const tenant = { id: 4 } as any;
			(
				mockAnalyticsService.getLastReturns as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.getLastReturns(tenant)).rejects.toThrow('boom');
		});
	});
});
