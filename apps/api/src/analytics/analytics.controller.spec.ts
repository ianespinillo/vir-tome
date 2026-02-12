import { Test, TestingModule } from '@nestjs/testing';
import { ROLES } from '@repo/common';
import { IAuthUser } from '../core/core.types';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
	let controller: AnalyticsController;
	const mockUser: Partial<IAuthUser> = {
		roleName: ROLES.ADMIN,
		tenantId: 1,
	};
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
			const result = await controller.getMostLoanedBooks(mockUser as IAuthUser);

			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledWith(
				5,
				mockUser,
			);
			expect(result.data).toEqual([
				{ id: 1, title: 'Book A', count: 12 },
				{ id: 2, title: 'Book B', count: 9 },
			]);
		});

		it('should honor provided limit and pass tenant id', async () => {
			await controller.getMostLoanedBooks(mockUser as IAuthUser, 3);

			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getMostLoanedBooks).toHaveBeenCalledWith(
				3,
				mockUser,
			);
		});
	});

	describe('getLastLoans', () => {
		it('should call service with tenant id', async () => {
			const result = await controller.getLastLoans(mockUser as IAuthUser);

			expect(mockAnalyticsService.getLastLoans).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getLastLoans).toHaveBeenCalledWith(mockUser);
			expect(result.data).toEqual([
				{ id: 101, bookId: 1, userId: 5, date: '2023-10-01' },
			]);
		});
	});

	describe('countBooks', () => {
		it('should call service without params and return its result', async () => {
			const result = await controller.countBooks(mockUser as IAuthUser);

			expect(mockAnalyticsService.countBooks).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.countBooks).toHaveBeenCalledWith(mockUser);
			expect(result.data).toEqual({ count: 42 });
		});
	});

	describe('countLoans', () => {
		it('should call service with tenant id', async () => {
			const result = await controller.countLoans(mockUser as IAuthUser);

			expect(mockAnalyticsService.countLoans).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.countLoans).toHaveBeenCalledWith(mockUser);
			expect(result.data).toEqual(7);
		});
	});

	describe('getLastReturns', () => {
		it('should call service with tenant id', async () => {
			const result = await controller.getLastReturns(mockUser as IAuthUser);

			expect(mockAnalyticsService.getLastReturns).toHaveBeenCalledTimes(1);
			expect(mockAnalyticsService.getLastReturns).toHaveBeenCalledWith(mockUser);
			expect(result.data).toEqual([
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
			(
				mockAnalyticsService.getLastLoans as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.getLastLoans(mockUser as IAuthUser)).rejects.toThrow(
				'boom',
			);
		});

		it('countBooks should propagate service errors', async () => {
			(
				mockAnalyticsService.countBooks as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.countBooks(mockUser as IAuthUser)).rejects.toThrow(
				'boom',
			);
		});

		it('countLoans should propagate service errors', async () => {
			(
				mockAnalyticsService.countLoans as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(controller.countLoans(mockUser as IAuthUser)).rejects.toThrow(
				'boom',
			);
		});

		it('getLastReturns should propagate service errors', async () => {
			(
				mockAnalyticsService.getLastReturns as unknown as jest.Mock
			).mockRejectedValueOnce(new Error('boom'));
			await expect(
				controller.getLastReturns(mockUser as IAuthUser),
			).rejects.toThrow('boom');
		});
	});
});
