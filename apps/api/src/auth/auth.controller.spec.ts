import { BadRequestException, UnauthorizedException } from '@nestjs/common';
// src/auth/__tests__/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
	IApiResponse,
	PAYLOAD_TYPE,
	ROLES,
	SignInDto,
	SignUpDto,
} from '@repo/common';
import { Response } from 'express';
import { IAuthUser } from '../core/core.types';
import { PasswordAdapter } from '../core/passport-adapter';
import { UsersService } from '../users/services/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

jest.mock('../core/passport-adapter', () => ({
	PasswordAdapter: {
		generateHashedPassword: jest.fn(),
	},
}));

describe('AuthController', () => {
	let authController: AuthController;
	let authService: AuthService;
	const controllerResponse: IApiResponse<any> = {
		message: expect.any(String),
		data: null,
		timestamp: expect.any(String),
		status: expect.any(Number),
	};
	const mockAuthService = {
		login: jest.fn(),
		register: jest.fn(),
		refreshToken: jest.fn(),
	};
	const mockUserService = {
		findById: jest.fn(),
		hasAccessToTenant: jest.fn(),
	};
	const mockRequest = {
		tenantId: 1,
		user: { userId: 1, tenantId: 1 },
	};

	const mockResponse = {
		cookie: jest.fn(),
	} as unknown as Response;

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
				{
					provide: UsersService,
					useValue: mockUserService,
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
			tenantId: mockRequest.tenantId,
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
			const result = await authController.login(loginDto, mockResponse);

			// Assert
			expect(authService.login).toHaveBeenCalledWith(
				loginDto,
				mockRequest.tenantId,
			);
			controllerResponse.data = expectedResult;
			expect(result).toEqual(controllerResponse);
		});

		it('should pass correct tenantId to service', async () => {
			// Arrange
			const differentDto = loginDto;
			differentDto.tenantId = 2;
			mockAuthService.login.mockResolvedValue({});

			// Act
			await authController.login(differentDto, mockResponse);

			// Assert
			expect(authService.login).toHaveBeenCalledWith(loginDto, 2);
		});
	});

	describe('register', () => {
		const registerDto: SignUpDto = {
			email: 'newuser@escuela1.com',
			name: 'New',
			surname: 'User',
			role: ROLES.SUPER_ADMIN,
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
			const result = await authController.register(
				registerDto,
				mockRequest.user as unknown as IAuthUser,
			);

			// Assert
			expect(authService.register).toHaveBeenCalledWith(
				registerDto,
				mockRequest.tenantId,
			);
			controllerResponse.data = expectedRegisterResult;
			expect(result).toEqual(controllerResponse);
		});

		it('should handle registration errors', async () => {
			// Arrange
			mockAuthService.register.mockRejectedValue(
				new BadRequestException('Email already exists'),
			);

			// Act & Assert
			await expect(
				authController.register(
					registerDto,
					mockRequest.user as unknown as IAuthUser,
				),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('refreshToken', () => {
		it('should refresh token', async () => {
			// Arrange
			const expectedResult = { access_token: 'new-jwt-token' };
			mockAuthService.refreshToken.mockResolvedValue(expectedResult);

			// Act
			const result = await authController.refresh(mockRequest, mockResponse);

			// Assert
			expect(authService.refreshToken).toHaveBeenCalledWith(
				mockRequest.user.userId,
				mockRequest.user.tenantId,
			);
			controllerResponse.data = expectedResult;
			expect(result).toEqual(controllerResponse);
		});

		it('should handle refresh token errors', async () => {
			// Arrange
			mockAuthService.refreshToken.mockRejectedValue(
				new UnauthorizedException('User not found'),
			);

			// Act & Assert
			await expect(
				authController.refresh(mockRequest, mockResponse),
			).rejects.toThrow(UnauthorizedException);
		});
	});
});
