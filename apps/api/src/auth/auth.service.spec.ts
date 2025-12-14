import { EmailService } from '@/email/email.service';
import { SuperAdminService } from '@/super-admin/services/super-admin.service';
import { TenantsService } from '@/tenants/tenants.service';
import { TokensService } from '@/tokens/tokens.service';
import { RoleService } from '@/users/services/role.service';
import { UsersService } from '@/users/services/users.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// src/auth/__tests__/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import {
	IAuthPayload,
	PAYLOAD_TYPE,
	ROLES,
	SignInDto,
	SignUpDto,
} from '@repo/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService - Multi-tenant', () => {
	let authService: AuthService;
	let usersService: UsersService;
	let jwtService: JwtService;
	let tokensService: TokensService;
	let roleService: RoleService;

	const mockUser = {
		id: 1,
		email: 'profesor@example.com',
		name: 'Juan',
		surname: 'Pérez',
		password: 'hashedPassword123',
		userTenants: [
			{
				id: 1,
				user_id: 1,
				tenant_id: 1,
				role_id: 2,
				is_active: true,
				tenant: { id: 1, name: 'Escuela 1', subdomain: 'escuela1' },
				role: { id: 2, name: ROLES.TEACHER },
			},
			{
				id: 2,
				user_id: 1,
				tenant_id: 2,
				role_id: 3,
				is_active: true,
				tenant: { id: 2, name: 'Escuela 2', subdomain: 'escuela2' },
				role: { id: 3, name: ROLES.LIBRARIAN },
			},
		],
		// getTenants must return the tenant objects (what AuthService expects)
		getTenants: jest.fn(() => mockUser.userTenants.map((ut) => ut.tenant)),
		getRoleInTenant: jest.fn((tenantId: number) => {
			return mockUser.userTenants.find((ut) => ut.tenant_id === tenantId)?.role;
		}),
		getRoleIdInTenant: jest.fn((tenantId: number) => {
			return mockUser.userTenants.find((ut) => ut.tenant_id === tenantId)?.role_id;
		}),
	};

	const mockUsersService = {
		findByEmail: jest.fn(),
		findById: jest.fn(),
		hasAccessToTenant: jest.fn(),
		getRoleInTenant: jest.fn(),
		getUserTenants: jest.fn(),
		create: jest.fn(),
		addUserToTenant: jest.fn(),
		updatePassword: jest.fn(),
	};

	const mockJwtService = {
		sign: jest.fn(() => 'mock-jwt-token'),
	};

	const mockTokensService = {
		generateToken: jest.fn(),
		validateToken: jest.fn(),
		markAsUsed: jest.fn(),
	};

	const mockEmailService = {
		forgotPasswordEmail: jest.fn(),
		sendEmailWelcome: jest.fn(),
		welcomeToTenantEmail: jest.fn(),
	};

	const mockSuperAdminService = {
		validateCredentials: jest.fn(),
	};
	const mockTenantService = {
		findById: jest.fn(),
	};
	const mockRoleService = {
		findRoleByName: jest.fn(),
	};
	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: JwtService, useValue: mockJwtService },
				{ provide: TokensService, useValue: mockTokensService },
				{ provide: EmailService, useValue: mockEmailService },
				{ provide: SuperAdminService, useValue: mockSuperAdminService },
				{ provide: TenantsService, useValue: mockTenantService },
				{ provide: RoleService, useValue: mockRoleService },
			],
		}).compile();

		authService = module.get<AuthService>(AuthService);
		usersService = module.get<UsersService>(UsersService);
		jwtService = module.get<JwtService>(JwtService);
		tokensService = module.get<TokensService>(TokensService);
		roleService = module.get<RoleService>(RoleService);

		jest.clearAllMocks();
	});

	describe('login (tenant específico)', () => {
		const loginDto: SignInDto = {
			email: 'profesor@example.com',
			password: 'password123',
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		it('should login user successfully in tenant 1', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 2,
				name: ROLES.TEACHER,
			});

			const result = await authService.login(loginDto, 1);

			expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.password,
			);
			expect(usersService.hasAccessToTenant).toHaveBeenCalledWith(1, 1);
			expect(usersService.getRoleInTenant).toHaveBeenCalledWith(1, 1);
			expect(jwtService.sign).toHaveBeenCalledWith({
				sub: mockUser.id,
				email: mockUser.email,
				tenantId: 1,
				roleId: 2,
				type: PAYLOAD_TYPE.USER_LOGIN,
			});
			expect(result).toHaveProperty('access_token');
			expect(result.user.tenantId).toBe(1);
		});

		it('should fail if user does not exist', async () => {
			mockUsersService.findByEmail.mockResolvedValue(null);

			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should fail with wrong password', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should fail if user has no access to tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUsersService.hasAccessToTenant.mockResolvedValue(false);

			await expect(authService.login(loginDto, 3)).rejects.toThrow(
				'User does not have access to this tenant',
			);
		});

		it('should fail if user has no role in tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.getRoleInTenant.mockResolvedValue(null);

			await expect(authService.login(loginDto, 1)).rejects.toThrow(
				'User has no role in this tenant',
			);
		});

		it('should use different roles in different tenants', async () => {
			// Login en tenant 1 como TEACHER
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 2,
				name: ROLES.TEACHER,
			});

			const result1 = await authService.login(loginDto, 1);
			expect(result1.user.roleId).toBe(2);

			// Login en tenant 2 como LIBRARIAN
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 3,
				name: ROLES.LIBRARIAN,
			});

			const result2 = await authService.login(loginDto, 2);
			expect(result2.user.roleId).toBe(3);
		});
	});

	describe('centralLogin (sin tenant específico)', () => {
		const loginDto: SignInDto = {
			email: 'profesor@example.com',
			password: 'password123',
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		it('should return tenant list when user has multiple tenants', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			// AuthService uses user.getTenants(), so mock the user method to return plain tenants
			mockUser.getTenants.mockReturnValue([
				{ id: 1, subdomain: 'escuela1', name: 'Escuela 1' },
				{ id: 2, subdomain: 'escuela2', name: 'Escuela 2' },
			]);

			const result = await authService.centralLogin(loginDto);
			expect(result.requiresTenantSelection).toBe(true);
			expect(result.tenants).toHaveLength(2);
			expect(result.tenants?.[0].subdomain).toBe('escuela1');
			expect(result.tenants?.[1].subdomain).toBe('escuela2');
			expect(result).not.toHaveProperty('access_token');
		});

		it('should auto-login when user has single tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUser.getTenants.mockReturnValue([
				{ id: 1, subdomain: 'escuela1', name: 'Escuela 1' },
			]);

			const result = await authService.centralLogin(loginDto);

			expect(result.requiresTenantSelection).toBe(false);
			expect(result).toHaveProperty('access_token');
			expect(result.tenant?.subdomain).toBe('escuela1');
		});

		it('should fail if user has no tenant access', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockUser.getTenants.mockReturnValue([]);

			await expect(authService.centralLogin(loginDto)).rejects.toThrow(
				'User has no tenant access',
			);
		});
	});

	describe('selectTenant', () => {
		it('should generate token for selected tenant', async () => {
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUser.getRoleIdInTenant(1);

			const result = await authService.selectTenant(1, 1);

			expect(usersService.hasAccessToTenant).toHaveBeenCalledWith(1, 1);
			expect(result).toHaveProperty('access_token');
			expect(result.user.tenantId).toBe(1);
		});

		it('should fail if user has no access to selected tenant', async () => {
			mockUsersService.hasAccessToTenant.mockResolvedValue(false);

			await expect(authService.selectTenant(1, 999)).rejects.toThrow(
				'User does not have access to this tenant',
			);
		});
	});

	describe('register', () => {
		const registerDto: SignUpDto = {
			email: 'newuser@example.com',
			name: 'New',
			surname: 'User',
			role: ROLES.STUDENT,
		};

		it('should create new user and add to tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(null);
			mockUsersService.create.mockResolvedValue({
				user: {
					id: 2,
					email: registerDto.email,
					name: registerDto.name,
					surname: registerDto.surname,
					getRoleIdInTenant: mockUser.getRoleIdInTenant,
				},
				password: 'hashedPassword123',
			});
			mockRoleService.findRoleByName.mockResolvedValue({
				id: 4,
				name: ROLES.STUDENT,
			});
			mockUser.getRoleIdInTenant(1);

			const result = await authService.register(registerDto, 1);
			expect(mockEmailService.sendEmailWelcome).toHaveBeenCalled();
			expect(usersService.create).toHaveBeenCalled();
			expect(result).toHaveProperty('email', registerDto.email);
			expect(result).toHaveProperty('name', registerDto.name);
			expect(result).toHaveProperty('surname', registerDto.surname);
			expect(result).toHaveProperty('tenantId', 1);
			expect(result).toHaveProperty('roleId');
		});

		it('should add existing user to new tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(false);
			mockUsersService.addUserToTenant.mockResolvedValue({});
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 4,
				name: ROLES.STUDENT,
			});
			mockTenantService.findById.mockResolvedValue({ id: 3, name: 'Escuela 3' });

			const result = await authService.register(registerDto, 3);
			expect(usersService.addUserToTenant).toHaveBeenCalledWith(1, 3, 4);
			expect(mockEmailService.welcomeToTenantEmail).toHaveBeenCalled();
			expect(usersService.create).not.toHaveBeenCalled();
		});

		it('should fail if user already exists in tenant', async () => {
			mockUsersService.findByEmail.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);

			await expect(authService.register(registerDto, 1)).rejects.toThrow(
				'User already exists in this tenant',
			);
		});
	});

	describe('validateJwtPayload', () => {
		const payload: IAuthPayload = {
			sub: 1,
			email: 'profesor@example.com',
			tenantId: 1,
			roleId: 2,
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		it('should validate payload and return user data', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 2,
				name: ROLES.TEACHER,
			});

			const result = await authService.validateJwtPayload(payload);

			expect(result.userId).toBe(1);
			expect(result.tenantId).toBe(1);
			expect(result.roleId).toBe(2);
			expect(result.roleName).toBe(ROLES.TEACHER);
		});

		it('should fail if user not found', async () => {
			mockUsersService.findById.mockResolvedValue(null);

			await expect(authService.validateJwtPayload(payload)).rejects.toThrow(
				'User not found',
			);
		});

		it('should fail if user has no access to tenant', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(false);

			await expect(authService.validateJwtPayload(payload)).rejects.toThrow(
				'User has no access to this tenant',
			);
		});
	});

	describe('refreshToken', () => {
		it('should generate new token for user in tenant', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(true);
			mockUsersService.getRoleInTenant.mockResolvedValue({
				id: 2,
				name: ROLES.TEACHER,
			});

			const result = await authService.refreshToken(1, 1);

			expect(result).toHaveProperty('access_token');
		});

		it('should fail if user has no access to tenant', async () => {
			mockUsersService.findById.mockResolvedValue(mockUser);
			mockUsersService.hasAccessToTenant.mockResolvedValue(false);

			await expect(authService.refreshToken(1, 999)).rejects.toThrow(
				'User has no access to this tenant',
			);
		});
	});
});
