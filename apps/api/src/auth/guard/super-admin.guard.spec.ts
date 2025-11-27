import { ExecutionContext, ForbiddenException } from '@nestjs/common';
// test/auth/guards/super-admin.guard.spec.ts
import { Test, type TestingModule } from '@nestjs/testing';
import { ROLES } from '@repo/common';
import { SuperAdminGuard } from './super-admin.guard';

describe('SuperAdminGuard', () => {
	let guard: SuperAdminGuard;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SuperAdminGuard],
		}).compile();

		guard = module.get<SuperAdminGuard>(SuperAdminGuard);
	});

	it('should be defined', () => {
		expect(guard).toBeDefined();
	});

	it('should allow access for SUPER_ADMIN', () => {
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: {
						id: 1,
						email: 'super@admin.com',
						roleName: ROLES.SUPER_ADMIN,
					},
				}),
			}),
		} as ExecutionContext;

		const result = guard.canActivate(mockContext);
		expect(result).toBe(true);
	});

	it('should deny access for non-SUPER_ADMIN', () => {
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: {
						id: 2,
						email: 'admin@school.com',
						roleName: ROLES.ADMIN,
					},
				}),
			}),
		} as ExecutionContext;

		expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
	});

	it('should deny access when no user', () => {
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: null,
				}),
			}),
		} as ExecutionContext;

		expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
	});

	it('should deny access when user has no role', () => {
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => ({
					user: {
						id: 3,
						email: 'user@school.com',
					},
				}),
			}),
		} as ExecutionContext;

		expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
	});
});
