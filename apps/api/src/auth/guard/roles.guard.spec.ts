// src/auth/guards/__tests__/roles.guard.spec.ts
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '@repo/common';
import { RolesGuard } from './role.guard';

describe('RolesGuard', () => {
	let guard: RolesGuard;
	let reflector: Reflector;

	beforeEach(() => {
		reflector = new Reflector();
		guard = new RolesGuard(reflector);
	});

	const createMockContext = (user: any, roles?: ROLES[]): ExecutionContext => {
		const mockContext = {
			switchToHttp: () => ({
				getRequest: () => ({ user }),
			}),
			getHandler: jest.fn(),
			getClass: jest.fn(),
		} as any;

		if (roles) {
			jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
		} else {
			jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
		}

		return mockContext;
	};

	it('should allow access when no roles required', () => {
		const user = { userId: 1, roleName: ROLES.STUDENT };
		const context = createMockContext(user);

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should allow access when user has required role', () => {
		const user = { userId: 1, roleName: ROLES.ADMIN };
		const context = createMockContext(user, [ROLES.ADMIN, ROLES.LIBRARIAN]);

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should deny access when user does not have required role', () => {
		const user = { userId: 1, roleName: ROLES.STUDENT };
		const context = createMockContext(user, [ROLES.ADMIN]);

		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
		expect(() => guard.canActivate(context)).toThrow(
			`Access denied. Required roles: ${ROLES.ADMIN}`,
		);
	});

	it('should throw when user has no role', () => {
		const user = { userId: 1 };
		const context = createMockContext(user, [ROLES.ADMIN]);

		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
		expect(() => guard.canActivate(context)).toThrow('User role not found');
	});

	it('should allow access with multiple valid roles', () => {
		const user = { userId: 1, roleName: ROLES.LIBRARIAN };
		const context = createMockContext(user, [
			ROLES.ADMIN,
			ROLES.LIBRARIAN,
			ROLES.TEACHER,
		]);

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should deny access when user role is not in required roles', () => {
		const user = { userId: 1, roleName: ROLES.TEACHER };
		const context = createMockContext(user, [ROLES.ADMIN, ROLES.LIBRARIAN]);

		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
		expect(() => guard.canActivate(context)).toThrow(
			`Access denied. Required roles: ${ROLES.ADMIN}, ${ROLES.LIBRARIAN}`,
		);
	});
});
