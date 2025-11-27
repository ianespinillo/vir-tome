import { PasswordAdapter } from '@/core/passport-adapter';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
// src/auth/__tests__/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PAYLOAD_TYPE, SignInDto, SignUpDto } from '@repo/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

jest.mock('@/core/passport-adapter', () => ({
	PasswordAdapter: {
		generateHashedPassword: jest.fn(),
	},
}));

describe('AuthController', () => {
	let authController: AuthController;
	let authService: AuthService;

	const mockAuthService = {
		login: jest.fn(),
		register: jest.fn(),
		refreshToken: jest.fn(),
	};

	const mockRequest = {
		tenantId: 1,
		user: { userId: 1, tenantId: 1 },
	};

	const mockTemporaryPassword = {
		hashedPassword:
			'$2b$10$8ZLFbXZEXZx8aXcW7t2zPeZXpUrx.zu8kUaDHH9jhrVLjMZaVYoe2',
		plainPassword: 'plainPassword123',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		authController = module.get<AuthController>(AuthController);
		authService = module.get<AuthService>(AuthService);

		jest.clearAllMocks();
		(PasswordAdapter.generateHashedPassword as jest.Mock).mockReset();
	});

	describe('login', () => {
		const loginDto: SignInDto = {
			email: 'test@escuela1.com',
			password: 'password123',
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		it('should login user', async () => {
			// Arrange
			const expectedResult = {
				access_token: 'jwt-token',
				user: {
					id: 1,
					email: 'test@escuela1.com',
					name: 'Test',
					surname: 'User',
					tenant_id: 1,
					roleId: 2,
				},
			};
			mockAuthService.login.mockResolvedValue(expectedResult);

			// Act
			const result = await authController.login(loginDto, mockRequest);

			// Assert
			expect(authService.login).toHaveBeenCalledWith(
				loginDto,
				mockRequest.tenantId,
			);
			expect(result).toBe(expectedResult);
		});

		it('should pass correct tenantId to service', async () => {
			// Arrange
			const requestWithDifferentTenant = { ...mockRequest, tenantId: 2 };
			mockAuthService.login.mockResolvedValue({});

			// Act
			await authController.login(loginDto, requestWithDifferentTenant);

			// Assert
			expect(authService.login).toHaveBeenCalledWith(loginDto, 2);
		});
	});

	describe('register', () => {
		const registerDto: SignUpDto = {
			email: 'newuser@escuela1.com',
			name: 'New',
			surname: 'User',
			roleId: 3,
		};

		const expectedRegisterResult = {
			access_token: 'jwt-token',
			user: {
				id: 2,
				email: 'newuser@escuela1.com',
				name: 'New',
				surname: 'User',
				tenant_id: 1,
				roleId: 3,
			},
			temporary_password: mockTemporaryPassword,
		};

		beforeEach(() => {
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue(
				mockTemporaryPassword,
			);
		});

		it('should register new user', async () => {
			// Arrange
			mockAuthService.register.mockResolvedValue(expectedRegisterResult);

			// Act
			const result = await authController.register(registerDto, mockRequest);

			// Assert
			expect(authService.register).toHaveBeenCalledWith(
				registerDto,
				mockRequest.tenantId,
			);
			expect(result).toBe(expectedRegisterResult);
		});

		it('should handle registration errors', async () => {
			// Arrange
			mockAuthService.register.mockRejectedValue(
				new BadRequestException('Email already exists'),
			);

			// Act & Assert
			await expect(
				authController.register(registerDto, mockRequest),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('refreshToken', () => {
		it('should refresh token', async () => {
			// Arrange
			const expectedResult = { access_token: 'new-jwt-token' };
			mockAuthService.refreshToken.mockResolvedValue(expectedResult);

			// Act
			const result = await authController.refresh(mockRequest);

			// Assert
			expect(authService.refreshToken).toHaveBeenCalledWith(
				mockRequest.user.userId,
				mockRequest.user.tenantId,
			);
			expect(result).toBe(expectedResult);
		});

		it('should handle refresh token errors', async () => {
			// Arrange
			mockAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('User not found'),
			);

			// Act & Assert
			await expect(authController.refresh(mockRequest)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
