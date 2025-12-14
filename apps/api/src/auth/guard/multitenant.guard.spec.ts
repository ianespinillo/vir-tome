import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MultitenantGuard } from './multitenant.guard';

describe('MultitenantGuard', () => {
	let guard: MultitenantGuard;

	// Mock del ExecutionContext
	const mockExecutionContext = {
		switchToHttp: jest.fn().mockReturnThis(),
		getRequest: jest.fn(),
	} as unknown as ExecutionContext;

	beforeEach(() => {
		guard = new MultitenantGuard();
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	describe('canActivate', () => {
		it('should return true if user has access to the tenant', () => {
			const mockUser = {
				id: 'user-id',
				hasAccessToTenant: jest.fn().mockReturnValue(true),
			};
			const mockTenant = {
				id: 'tenant-id',
			};

			(
				mockExecutionContext.switchToHttp().getRequest as jest.Mock
			).mockReturnValue({
				user: mockUser,
				tenant: mockTenant,
			});

			const result = guard.canActivate(mockExecutionContext);

			expect(result).toBe(true);
			expect(mockUser.hasAccessToTenant).toHaveBeenCalledWith(mockTenant.id);
		});

		it('should throw UnauthorizedException if user context is missing', () => {
			(
				mockExecutionContext.switchToHttp().getRequest as jest.Mock
			).mockReturnValue({
				user: undefined,
				tenant: { id: 'tenant-id' },
			});

			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				UnauthorizedException,
			);
			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				'Missing user',
			);
		});

		it('should throw UnauthorizedException if tenant context is missing', () => {
			(
				mockExecutionContext.switchToHttp().getRequest as jest.Mock
			).mockReturnValue({
				user: { hasAccessToTenant: jest.fn() },
				tenant: undefined,
			});

			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				UnauthorizedException,
			);
			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				'Missing tenant',
			);
		});

		it('should throw UnauthorizedException if user does not have access to tenant (tenant mismatch)', () => {
			const mockUser = {
				id: 'user-id',
				hasAccessToTenant: jest.fn().mockReturnValue(false),
			};
			const mockTenant = {
				id: 'tenant-id',
			};

			(
				mockExecutionContext.switchToHttp().getRequest as jest.Mock
			).mockReturnValue({
				user: mockUser,
				tenant: mockTenant,
			});

			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				UnauthorizedException,
			);
			expect(() => guard.canActivate(mockExecutionContext)).toThrow(
				'Access denied: tenant mismatch',
			);
			expect(mockUser.hasAccessToTenant).toHaveBeenCalledWith(mockTenant.id);
		});
	});
});
