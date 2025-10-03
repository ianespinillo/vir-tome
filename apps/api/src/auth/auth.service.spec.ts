import { PasswordAdapter } from '@/core/passport-adapter';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { IAuthPayload, SignInDto, SignUpDto } from '@repo/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/services/users.service';
import { AuthService } from './auth.service';

// Mock de bcrypt y PasswordAdapter
jest.mock('bcrypt');
jest.mock('@/core/passport-adapter', () => ({
	PasswordAdapter: {
		generateHashedPassword: jest.fn(),
	},
}));

describe('AuthService', () => {
	let authService: AuthService;
	let usersService: UsersService;
	let jwtService: JwtService;

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
		deleted_at: null,
	};

	const mockUsersService = {
		findOne: jest.fn(),
		findById: jest.fn(),
		create: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(() => 'mock-jwt-token'),
	};

	const mockTemporaryPassword = {
		hashedPassword:
			'$2b$10$8ZLFbXZEXZx8aXcW7t2zPeZXpUrx.zu8kUaDHH9jhrVLjMZaVYoe2',
		password: 'plainPassword123',
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
			],
		}).compile();

		authService = module.get<AuthService>(AuthService);
		usersService = module.get<UsersService>(UsersService);
		jwtService = module.get<JwtService>(JwtService);

		// Reset mocks
		jest.clearAllMocks();
		(PasswordAdapter.generateHashedPassword as jest.Mock).mockReset();
	});

	describe('login', () => {
		const loginDto: SignInDto = {
			email: 'test@escuela1.com',
			password: 'password123',
		};

		it('should successfully login user in correct tenant', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			// Act
			const result = await authService.login(loginDto, 1);

			// Assert
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
			expect(result).toEqual({
				access_token: 'mock-jwt-token',
				user: {
					id: mockUser.id,
					email: mockUser.email,
					name: mockUser.name,
					surname: mockUser.surname,
					tenant_id: mockUser.tenant_id,
					roleId: mockUser.role.id,
				},
			});
		});

		it('should fail login with wrong tenant', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.login(loginDto, 999)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(usersService.findOne).toHaveBeenCalledWith(999, {
				email: loginDto.email,
			});
		});

		it('should fail login with wrong password', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			// Act & Assert
			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.password,
			);
		});

		it('should fail login when user not found in tenant', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should include tenantId in JWT payload', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			// Act
			await authService.login(loginDto, 1);

			// Assert
			expect(jwtService.sign).toHaveBeenCalledWith(
				expect.objectContaining({
					tenantId: 1,
				}),
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
			password: mockTemporaryPassword.hashedPassword,
			tenant_id: 1,
			role: {
				id: 3,
				name: 'student',
			},
			deleted_at: null,
		};

		beforeEach(() => {
			(PasswordAdapter.generateHashedPassword as jest.Mock).mockResolvedValue(
				mockTemporaryPassword,
			);
		});

		it('should successfully register new user', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null); // Email no existe
			mockUsersService.create.mockResolvedValue(createdUser);

			// Act
			const result = await authService.register(registerDto, 1);

			// Assert
			expect(usersService.findOne).toHaveBeenCalledWith(1, {
				email: registerDto.email,
			});
			expect(PasswordAdapter.generateHashedPassword).toHaveBeenCalledWith(8);
			expect(usersService.create).toHaveBeenCalledWith(1, {
				email: registerDto.email,
				name: registerDto.name,
				surname: registerDto.surname,
				password: mockTemporaryPassword.hashedPassword,
				role: {
					id: registerDto.roleId,
				},
				tenant_id: 1,
			});
			expect(result).toEqual({
				access_token: 'mock-jwt-token',
				user: {
					id: createdUser.id,
					email: createdUser.email,
					name: createdUser.name,
					surname: createdUser.surname,
					tenant_id: createdUser.tenant_id,
					roleId: createdUser.role.id,
				},
				temporary_password: mockTemporaryPassword,
			});
		});

		it('should allow same email in different tenants', async () => {
			// Arrange
			const email = 'user@example.com';
			const dto = { ...registerDto, email };

			// Tenant 1 - Email no existe
			mockUsersService.findOne.mockResolvedValueOnce(null);
			mockUsersService.create.mockResolvedValueOnce({
				...createdUser,
				email,
				tenant_id: 1,
			});

			// Tenant 2 - Mismo email, diferente tenant
			mockUsersService.findOne.mockResolvedValueOnce(null);
			mockUsersService.create.mockResolvedValueOnce({
				...createdUser,
				id: 3,
				email,
				tenant_id: 2,
			});

			// Act
			const result1 = await authService.register(dto, 1);
			const result2 = await authService.register(dto, 2);

			// Assert
			expect(result1.user.tenant_id).toBe(1);
			expect(result2.user.tenant_id).toBe(2);
			expect(result1.user.email).toBe(result2.user.email);
			expect(PasswordAdapter.generateHashedPassword).toHaveBeenCalledTimes(2);
		});

		it('should prevent duplicate email in same tenant', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(mockUser);

			// Act & Assert
			await expect(authService.register(registerDto, 1)).rejects.toThrow(
				BadRequestException,
			);
			await expect(authService.register(registerDto, 1)).rejects.toThrow(
				'Email already exists in this tenant',
			);
			expect(PasswordAdapter.generateHashedPassword).not.toHaveBeenCalled();
			expect(usersService.create).not.toHaveBeenCalled();
		});

		it('should generate hashed password using PasswordAdapter', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(createdUser);

			// Act
			await authService.register(registerDto, 1);

			// Assert
			expect(PasswordAdapter.generateHashedPassword).toHaveBeenCalledWith(8);
			expect(usersService.create).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					password: mockTemporaryPassword.hashedPassword,
				}),
			);
		});

		it('should return temporary password object with both hashed and plain password', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(createdUser);

			// Act
			const result = await authService.register(registerDto, 1);

			// Assert
			expect(result.temporary_password).toBeDefined();
			expect(typeof result.temporary_password).toBe('object');
			expect(result.temporary_password).toHaveProperty('hashedPassword');
			expect(result.temporary_password).toHaveProperty('password');
			expect(result.temporary_password.hashedPassword).toBe(
				mockTemporaryPassword.hashedPassword,
			);
			expect(result.temporary_password.password).toBe(
				mockTemporaryPassword.password,
			);
		});

		it('should include tenant_id in created user', async () => {
			// Arrange
			mockUsersService.findOne.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue(createdUser);

			// Act
			const result = await authService.register(registerDto, 1);

			// Assert
			expect(usersService.create).toHaveBeenCalledWith(
				1,
				expect.objectContaining({
					tenant_id: 1,
				}),
			);
			expect(result.user.tenant_id).toBe(1);
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
			// Arrange
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await authService.validateJwtPayload(payload);

			// Assert
			expect(usersService.findById).toHaveBeenCalledWith(
				payload.tenantId,
				payload.sub,
			);
			expect(result).toEqual({
				userId: mockUser.id,
				email: mockUser.email,
				tenantId: mockUser.tenant_id,
				roleId: mockUser.role.id,
				roleName: mockUser.role.name,
			});
		});

		it('should fail if user not found in tenant', async () => {
			// Arrange
			mockUsersService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.validateJwtPayload(payload)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(authService.validateJwtPayload(payload)).rejects.toThrow(
				'User not found in tenant',
			);
		});

		it('should search user in correct tenant', async () => {
			// Arrange
			const payloadTenant2 = { ...payload, tenantId: 2 };
			mockUsersService.findById.mockResolvedValue({
				...mockUser,
				tenant_id: 2,
			});

			// Act
			await authService.validateJwtPayload(payloadTenant2);

			// Assert
			expect(usersService.findById).toHaveBeenCalledWith(2, payload.sub);
		});
	});

	describe('refreshToken', () => {
		it('should generate new access token', async () => {
			// Arrange
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			const result = await authService.refreshToken(1, 1);

			// Assert
			expect(usersService.findById).toHaveBeenCalledWith(1, 1);
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: mockUser.id,
				email: mockUser.email,
				roleId: mockUser.role.id,
				tenantId: mockUser.tenant_id,
			});
			expect(result).toEqual({
				access_token: 'mock-jwt-token',
			});
		});

		it('should fail if user not found', async () => {
			// Arrange
			mockUsersService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.refreshToken(1, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should validate tenant when refreshing', async () => {
			// Arrange
			mockUsersService.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(authService.refreshToken(1, 999)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(usersService.findById).toHaveBeenCalledWith(999, 1);
		});

		it('should include correct user data in new token', async () => {
			// Arrange
			mockUsersService.findById.mockResolvedValue(mockUser);

			// Act
			await authService.refreshToken(1, 1);

			// Assert
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: mockUser.id,
				email: mockUser.email,
				roleId: mockUser.role.id,
				tenantId: mockUser.tenant_id,
			});
		});
	});
});
