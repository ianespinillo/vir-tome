// src/auth/guards/__tests__/multitenant.guard.spec.ts
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MultitenantGuard } from './multitenant.guard';

describe('MultitenantGuard', () => {
	let guard: MultitenantGuard;

	beforeEach(() => {
		guard = new MultitenantGuard();
	});

	const createMockContext = (req: any): ExecutionContext =>
		({
			switchToHttp: () => ({
				getRequest: () => req,
			}),
		}) as any;

	it('should allow access when tenant matches', () => {
		const mockRequest = {
			user: { userId: 1, tenant_id: 1 },
			tenant: { id: 1 },
			tenantId: 1,
		};

		const context = createMockContext(mockRequest);
		expect(guard.canActivate(context)).toBe(true);
	});

	it('should throw if user is missing', () => {
		const mockRequest = {
			tenant: { id: 1 },
			tenantId: 1,
		};

		const context = createMockContext(mockRequest);
		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
		expect(() => guard.canActivate(context)).toThrow(
			'Missing user or tenant context',
		);
	});

	it('should throw if tenant is missing', () => {
		const mockRequest = {
			user: { userId: 1, tenant_id: 1 },
			tenantId: 1,
		};

		const context = createMockContext(mockRequest);
		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
	});

	it('should throw if tenant mismatch', () => {
		const mockRequest = {
			user: { userId: 1, tenant_id: 1 },
			tenant: { id: 2 },
			tenant_id: 2,
		};

		const context = createMockContext(mockRequest);
		expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
		expect(() => guard.canActivate(context)).toThrow(
			'Access denied: tenant mismatch',
		);
	});
});
