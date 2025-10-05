import 'reflect-metadata';
import { PasswordAdapter } from '@/core/passport-adapter';
import { EmailService } from '@/email/email.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
	ForgotPasswordDTO,
	IAuthPayload,
	ResetPasswordDto,
	SignInDto,
	SignUpDto,
	TokenTypes,
} from '@repo/common';
import * as bcrypt from 'bcrypt';
import { TokensService } from '../tokens/tokens.service';
import { UsersService } from '../users/services/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
	let authService: AuthService;
	let usersService: UsersService;
	let jwtService: JwtService;
	let tokensService: TokensService;

	const mockUser = {
		id: 1,
		email: 'test@escuela1.com',
		name: 'Test',
		surname: 'User',
		password: 'hashedPassword123',
		tenant_id: 1,
		role: {
			id: 2,
			name: 'teacher',
		},
		tenant: {
			id: 1,
			name: 'Escuela 1',
			subdomain: 'escuela1',
		},
	};

	const mockUsersService = {
		findOne: jest.fn(),
		findUserByEmail: jest.fn(),
		findById: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(() => 'mock-jwt-token'),
	};
	const passwordAdapterMock = {
		hashPassword: jest.fn().mockResolvedValue('newHashedPassword'),
	};

	const mockTokensService = {
		generateToken: jest.fn(),
		validateToken: jest.fn(),
		markAsUsed: jest.fn(),
	};
	const mockEmailService = {
		forgotPasswordEmail: jest.fn(),
	};
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
				{
					provide: TokensService,
					useValue: mockTokensService,
				},
				{
					provide: EmailService,
					useValue: mockEmailService,
				},
				{
					provide: PasswordAdapter,
					useValue: passwordAdapterMock,
				},
			],
		}).compile();

		authService = module.get<AuthService>(AuthService);
		usersService = module.get<UsersService>(UsersService);
		jwtService = module.get<JwtService>(JwtService);
		tokensService = module.get<TokensService>(TokensService);

		jest.clearAllMocks();
	});

	describe('login', () => {
		const loginDto: SignInDto = {
			email: 'test@escuela1.com',
			password: 'password123',
		};

		it('should successfully login user in correct tenant', async () => {
			mockUsersService.findOne.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			const result = await authService.login(loginDto, 1);

			expect(usersService.findOne).toHaveBeenCalledWith(1, {
				email: loginDto.email,
			});
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.password,
			);
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: mockUser.id,
				email: mockUser.email,
				tenantId: mockUser.tenant_id,
				roleId: mockUser.role.id,
			} as IAuthPayload);
			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('user');
		});

		it('should fail login with wrong tenant', async () => {
			mockUsersService.findOne.mockResolvedValue(null);

			await expect(authService.login(loginDto, 999)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should fail login with wrong password', async () => {
			mockUsersService.findOne.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('register', () => {
		const registerDto: SignUpDto = {
			email: 'newuser@escuela1.com',
			name: 'New',
			surname: 'User',
			roleId: 3,
		};

		const createdUser = {
			id: 2,
			email: registerDto.email,
			name: registerDto.name,
			surname: registerDto.surname,
			password: 'hashedPassword456',
			tenant_id: 1,
			role: {
				id: 3,
				name: 'student',
			},
		};

		it('should successfully register new user', async () => {
			mockUsersService.findOne.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(createdUser);
			(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword456');

			const result = await authService.register(registerDto, 1);

			expect(usersService.findOne).toHaveBeenCalledWith(1, {
				email: registerDto.email,
			});
			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('user');
			expect(result).toHaveProperty('temporary_password');
		});

		it('should allow same email in different tenants', async () => {
			mockUsersService.findOne.mockResolvedValueOnce(null);
			mockUsersService.create.mockResolvedValueOnce({
				...createdUser,
				tenant_id: 1,
			});

			mockUsersService.findOne.mockResolvedValueOnce(null);
			mockUsersService.create.mockResolvedValueOnce({
				...createdUser,
				id: 3,
				tenant_id: 2,
			});

			(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

			const result1 = await authService.register(registerDto, 1);
			const result2 = await authService.register(registerDto, 2);

			expect(result1.user.tenant_id).toBe(1);
			expect(result2.user.tenant_id).toBe(2);
		});

		it('should prevent duplicate email in same tenant', async () => {
			mockUsersService.findOne.mockResolvedValue(mockUser);

			await expect(authService.register(registerDto, 1)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('forgotPassword', () => {
		const forgotDto: ForgotPasswordDTO = {
			email: 'test@escuela1.com',
		};

		it('should generate reset token for valid user in tenant', async () => {
			mockUsersService.findUserByEmail.mockResolvedValue(mockUser);
			mockTokensService.generateToken.mockResolvedValue({
				token: 'reset-token-123',
				expires: new Date(),
			});

			const result = await authService.forgotPassword(forgotDto, 1);

			expect(usersService.findUserByEmail).toHaveBeenCalledWith(
				forgotDto.email,
				1,
			);
			expect(tokensService.generateToken).toHaveBeenCalledWith({
				user_id: mockUser.id,
				type: TokenTypes.FORGOT_PASSWORD,
				expiresInHours: 1,
				metadata: { tenantId: 1 },
			});
			expect(mockEmailService.forgotPasswordEmail).toHaveBeenCalled();
		});

		it('should not reveal if email does not exist', async () => {
			mockUsersService.findUserByEmail.mockResolvedValue(null);

			const result = await authService.forgotPassword(forgotDto, 1);

			expect(result?.message).toContain('If email exists, reset link sent');
			expect(tokensService.generateToken).not.toHaveBeenCalled();
		});

		it('should search user only in specified tenant', async () => {
			mockUsersService.findUserByEmail.mockResolvedValue(null);

			await authService.forgotPassword(forgotDto, 2);

			expect(usersService.findUserByEmail).toHaveBeenCalledWith(
				forgotDto.email,
				2,
			);
		});
	});

	describe('resetPassword', () => {
		const resetDto: ResetPasswordDto = {
			token: 'reset-token-123',
			newPassword: 'newPassword123',
		};

		const mockToken = {
			id: 'token-1',
			user_id: 1,
			metadata: { tenantId: 1 },
		};

		it('should reset password with valid token', async () => {
			mockTokensService.validateToken.mockResolvedValue(mockToken);
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.update.mockResolvedValue(mockUser);
			(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

			const result = await authService.resetPassword(resetDto, 1);

			expect(tokensService.validateToken).toHaveBeenCalledWith(resetDto.token, 1);
			expect(usersService.findById).toHaveBeenCalledWith(1, mockToken.user_id);
			expect(usersService.update).toHaveBeenCalledWith(1, mockUser.id, {
				password: expect.any(String),
			});
			expect(tokensService.markAsUsed).toHaveBeenCalledWith('token-1', 1);
			expect(result?.message).toBe('Password reset successfully');
		});

		it('should fail with token from different tenant', async () => {
			mockTokensService.validateToken.mockRejectedValue(
				new BadRequestException('Token no válido para este tenant'),
			);

			await expect(authService.resetPassword(resetDto, 2)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should fail if user not found', async () => {
			mockTokensService.validateToken.mockResolvedValue(mockToken);
			mockUsersService.findById.mockResolvedValue(null);

			await expect(authService.resetPassword(resetDto, 1)).rejects.toThrow(
				BadRequestException,
			);
			await expect(authService.resetPassword(resetDto, 1)).rejects.toThrow(
				'User not found',
			);
		});

		it('should mark token as used after successful reset', async () => {
			mockTokensService.validateToken.mockResolvedValue(mockToken);
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.update.mockResolvedValue(mockUser);
			(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');

			await authService.resetPassword(resetDto, 1);

			expect(tokensService.markAsUsed).toHaveBeenCalledWith('token-1', 1);
		});
	});

	describe('validateJwtPayload', () => {
		const payload: IAuthPayload = {
			sub: 1,
			email: 'test@escuela1.com',
			tenantId: 1,
			roleId: 2,
		};

		it('should validate payload and return user data', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);

			const result = await authService.validateJwtPayload(payload);

			expect(result).toEqual({
				userId: mockUser.id,
				email: mockUser.email,
				tenantId: mockUser.tenant_id,
				roleId: mockUser.role.id,
				roleName: mockUser.role.name,
			});
		});

		it('should fail if user not found in tenant', async () => {
			mockUsersService.findById.mockResolvedValue(null);

			await expect(authService.validateJwtPayload(payload)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('refreshToken', () => {
		it('should generate new access token', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);

			const result = await authService.refreshToken(1, 1);

			expect(result).toEqual({
				access_token: 'mock-jwt-token',
			});
		});

		it('should fail if user not found', async () => {
			mockUsersService.findById.mockResolvedValue(null);

			await expect(authService.refreshToken(1, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
