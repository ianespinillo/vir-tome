import { UsersService } from '@/users/services/users.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PAYLOAD_TYPE } from '@repo/common';
import { MultitenantGuard } from './multitenant.guard'; // Ajusta la ruta

describe('MultitenantGuard', () => {
	let guard: MultitenantGuard;
	let userService: UsersService;

	// Mock del ExecutionContext de NestJS
	const mockExecutionContext = (user?: any): Partial<ExecutionContext> => ({
		switchToHttp: jest.fn().mockReturnValue({
			getRequest: jest.fn().mockReturnValue({ user }),
		}),
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MultitenantGuard,
				{
					provide: UsersService,
					useValue: {
						hasAccessToTenant: jest.fn(),
					},
				},
			],
		}).compile();

		guard = module.get<MultitenantGuard>(MultitenantGuard);
		userService = module.get<UsersService>(UsersService);
	});

	it('debería estar definido', () => {
		expect(guard).toBeDefined();
	});

	it('debería lanzar UnauthorizedException si no hay usuario en la request', async () => {
		const context = mockExecutionContext(null) as ExecutionContext;

		await expect(guard.canActivate(context)).rejects.toThrow(
			new UnauthorizedException('Missing user'),
		);
	});

	it('debería permitir el acceso si el usuario es SUPER_ADMIN_LOGIN', async () => {
		const user = { type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN };
		const context = mockExecutionContext(user) as ExecutionContext;

		const result = await guard.canActivate(context);
		expect(result).toBe(true);
	});

	it('debería lanzar UnauthorizedException si falta el objeto tenant en el usuario', async () => {
		const user = {
			type: 'USER', // Cualquier tipo que no sea super admin
			tenant: null,
		};
		const context = mockExecutionContext(user) as ExecutionContext;

		await expect(guard.canActivate(context)).rejects.toThrow(
			new UnauthorizedException('Missing tenant'),
		);
	});

	it('debería lanzar UnauthorizedException si el servicio deniega el acceso al tenant', async () => {
		const user = {
			id: 1,
			tenantId: 10,
			tenant: { id: 10 },
			type: 'USER',
		};
		const context = mockExecutionContext(user) as ExecutionContext;

		// Simulamos que el usuario no tiene acceso a ese tenant ID
		jest.spyOn(userService, 'hasAccessToTenant').mockResolvedValue(false);

		await expect(guard.canActivate(context)).rejects.toThrow(
			new UnauthorizedException('Access denied: tenant mismatch'),
		);
		expect(userService.hasAccessToTenant).toHaveBeenCalledWith(1, 10);
	});

	it('debería permitir el acceso si el usuario tiene acceso validado al tenant', async () => {
		const user = {
			id: 1,
			tenantId: 10,
			tenant: { id: 10 },
			type: 'USER',
		};
		const context = mockExecutionContext(user) as ExecutionContext;

		jest.spyOn(userService, 'hasAccessToTenant').mockResolvedValue(true);

		const result = await guard.canActivate(context);
		expect(result).toBe(true);
		expect(userService.hasAccessToTenant).toHaveBeenCalledWith(1, 10);
	});
});
