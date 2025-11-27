// src/auth/auth.service.ts
import { PasswordAdapter } from '@/core/passport-adapter';
import { EmailService } from '@/email/email.service';
import { SuperAdminService } from '@/super-admin/services/super-admin.service';
import { TenantsService } from '@/tenants/tenants.service';
import { TokensService } from '@/tokens/tokens.service';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
	ForgotPasswordDTO,
	type IAuthPayload,
	type ISuperAdminLoginPayload,
	SignInDto as LoginDto,
	PAYLOAD_TYPE,
	ResetPasswordDto,
	SignUpDto,
	TokenTypes,
} from '@repo/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly tokensService: TokensService,
		private readonly emailService: EmailService,
		private readonly superAdminService: SuperAdminService,
		private readonly tenantService: TenantsService,
	) {}

	// ============================================
	// LOGIN MULTI-TENANT (con tenant específico)
	// ============================================

	/**
	 * Login en un tenant específico
	 * @param loginDto - Email y password
	 * @param tenantId - Extraído del middleware (req.tenantId)
	 */
	async login(loginDto: LoginDto, tenantId: number) {
		// 1. Buscar usuario por email (global)
		const user = await this.usersService.findByEmail(loginDto.email);

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// 2. Validar password
		const isPasswordValid = await bcrypt.compare(
			loginDto.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// 3. Verificar que el usuario tiene acceso a este tenant
		const hasAccess = await this.usersService.hasAccessToTenant(
			user.id,
			tenantId,
		);
		if (!hasAccess) {
			throw new UnauthorizedException('User does not have access to this tenant');
		}

		// 4. Obtener rol del usuario en este tenant
		const role = await this.usersService.getRoleInTenant(user.id, tenantId);
		if (!role) {
			throw new UnauthorizedException('User has no role in this tenant');
		}

		// 5. Generar JWT con tenant_id incluido
		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			tenantId: tenantId,
			roleId: role.id,
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname,
				tenantId: tenantId,
				roleId: role.id,
				roleName: role.name,
			},
		};
	}

	// ============================================
	// LOGIN CENTRALIZADO (sin tenant específico)
	// ============================================

	/**
	 * Login centralizado - devuelve lista de tenants si el usuario tiene múltiples
	 */
	async centralLogin(loginDto: LoginDto) {
		// 1. Buscar usuario por email
		const user = await this.usersService.findByEmail(loginDto.email);

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// 2. Validar password
		const isPasswordValid = await bcrypt.compare(
			loginDto.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		if (user.getTenants().length === 0) {
			throw new UnauthorizedException('User has no tenant access');
		}

		// 4. Si tiene múltiples tenants, devolver lista para que elija
		if (user.getTenants().length > 1) {
			return {
				requiresTenantSelection: true,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					surname: user.surname,
				},
				tenants: user.getTenants().map((ut) => ({
					id: ut.id,
					subdomain: ut.subdomain,
					name: ut.name,
					role: user.getRoleInTenant(ut.id)?.name || null,
				})),
			};
		}

		// 5. Si tiene un solo tenant, generar token directamente
		const singleTenant = user.userTenants[0];
		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			tenantId: singleTenant.tenant_id,
			roleId: singleTenant.role_id,
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		return {
			requiresTenantSelection: false,
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname,
			},
			tenant: {
				id: singleTenant.tenant.id,
				subdomain: singleTenant.tenant.subdomain,
				name: singleTenant.tenant.name,
			},
		};
	}

	/**
	 * Seleccionar tenant después del login centralizado
	 * Frontend llama esto después de que el usuario elija
	 */
	async selectTenant(userId: number, tenantId: number) {
		// Verificar que el usuario tiene acceso a este tenant
		const hasAccess = await this.usersService.hasAccessToTenant(userId, tenantId);
		if (!hasAccess) {
			throw new UnauthorizedException('User does not have access to this tenant');
		}

		// Obtener datos del usuario y su rol en el tenant
		const user = await this.usersService.findById(userId);
		if (!user) {
			throw new UnauthorizedException('User not found');
		}
		if (user.getRoleInTenant(tenantId) == null) {
			throw new UnauthorizedException('User has no role in this tenant');
		}

		// Generar token para el tenant seleccionado
		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			tenantId: tenantId,
			roleId: user.getRoleIdInTenant(tenantId),
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname,
				tenantId: tenantId,
				roleId: user.getRoleIdInTenant(tenantId),
				roleName: user.getRoleInTenant(tenantId)?.name || null,
			},
		};
	}

	// ============================================
	// REGISTRO
	// ============================================

	/**
	 * Registro en un tenant específico
	 */
	async register(registerDto: SignUpDto, tenantId: number) {
		// 1. Verificar si el email ya existe globalmente
		const user = await this.usersService.findByEmail(registerDto.email);

		if (user) {
			// Usuario existe, verificar si ya está en este tenant
			const hasAccess = await this.usersService.hasAccessToTenant(
				user.id,
				tenantId,
			);
			if (hasAccess) {
				throw new BadRequestException('User already exists in this tenant');
			}

			// Usuario existe pero no en este tenant, agregarlo
			await this.usersService.addUserToTenant(
				user.id,
				tenantId,
				registerDto.roleId,
			);
			await this.emailService.welcomeToTenantEmail({
				email: user.email,
				isNewUser: false,
				tenantName: (await this.tenantService.findById(tenantId)).name,
				userName: user.name,
				loginUrl: `https://${process.env.FRONTEND_URL}/auth/sign-in`,
			});
			return {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname,
				tenantId: tenantId,
				roleId: registerDto.roleId,
			};
		}
		const result = await this.usersService.create(tenantId, registerDto);
		await this.emailService.sendEmailWelcome({
			to: result.user.email,
			password: result.password,
		});
		return {
			id: result.user.id,
			email: result.user.email,
			name: result.user.name,
			surname: result.user.surname,
			tenantId: tenantId,
			roleId: registerDto.roleId,
		};
	}

	// ============================================
	// JWT VALIDATION
	// ============================================

	/**
	 * Validar JWT y extraer datos del usuario
	 * Usado por el JWT Strategy
	 */
	async validateJwtPayload(payload: IAuthPayload) {
		// 1. Buscar usuario
		const user = await this.usersService.findById(payload.sub);
		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		// 2. Verificar que tiene acceso al tenant
		const hasAccess = await this.usersService.hasAccessToTenant(
			payload.sub,
			payload.tenantId,
		);
		if (!hasAccess) {
			throw new UnauthorizedException('User has no access to this tenant');
		}

		// 3. Obtener rol en el tenant
		const role = await this.usersService.getRoleInTenant(
			payload.sub,
			payload.tenantId,
		);
		if (!role) {
			throw new UnauthorizedException('User has no role in this tenant');
		}

		return {
			userId: user.id,
			email: user.email,
			tenantId: payload.tenantId,
			roleId: role.id,
			roleName: role.name,
		};
	}

	// ============================================
	// REFRESH TOKEN
	// ============================================

	async refreshToken(userId: number, tenantId: number) {
		const user = await this.usersService.findById(userId);
		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		const hasAccess = await this.usersService.hasAccessToTenant(userId, tenantId);
		if (!hasAccess) {
			throw new UnauthorizedException('User has no access to this tenant');
		}

		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			roleId: user.getRoleIdInTenant(tenantId),
			tenantId: tenantId,
			type: PAYLOAD_TYPE.USER_LOGIN,
		};

		return {
			access_token: this.jwtService.sign(payload),
		};
	}

	// ============================================
	// PASSWORD RESET
	// ============================================

	async forgotPassword({ email }: ForgotPasswordDTO, tenantId: number) {
		// Buscar user globalmente
		const user = await this.usersService.findByEmail(email);
		if (!user) {
			return { message: 'If email exists, reset link sent' };
		}

		// Verificar que tiene acceso a este tenant
		const hasAccess = await this.usersService.hasAccessToTenant(
			user.id,
			tenantId,
		);
		if (!hasAccess) {
			return { message: 'If email exists, reset link sent' };
		}

		const token = await this.tokensService.generateToken({
			expiresInHours: 1,
			user_id: user.id,
			type: TokenTypes.FORGOT_PASSWORD,
			metadata: { tenantId },
		});

		await this.emailService.forgotPasswordEmail({
			email,
			token: token.token,
			expires: new Date(Date.now() + 3600000),
		});

		return { message: 'If email exists, reset link sent' };
	}

	async resetPassword(
		{ token, newPassword }: ResetPasswordDto,
		tenantId: number,
	) {
		const validToken = await this.tokensService.validateToken(token, tenantId);

		if (validToken.metadata?.tenantId !== tenantId) {
			throw new BadRequestException('Invalid token for tenant');
		}

		const user = await this.usersService.findById(validToken.user_id);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		try {
			const newHashedPassword = await PasswordAdapter.hashPassword(newPassword);
			await this.usersService.updatePassword(user.id, newHashedPassword);
			await this.tokensService.markAsUsed(validToken.id, tenantId);

			return {
				message: 'Password reset successfully',
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new InternalServerErrorException(
					'Something wrong during password update',
				);
			}
			throw error;
		}
	}

	// ============================================
	// SUPER ADMIN LOGIN
	// ============================================

	async adminLogin({ email, password }: LoginDto) {
		const superAdmin = await this.superAdminService.validateCredentials(
			email,
			password,
		);

		if (!superAdmin) {
			throw new UnauthorizedException('Invalid super admin credentials');
		}

		const payload: ISuperAdminLoginPayload = {
			sub: superAdmin.id,
			email: superAdmin.email,
			type: PAYLOAD_TYPE.SUPER_ADMIN_LOGIN,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: superAdmin.id,
				email: superAdmin.email,
				name: superAdmin.name,
			},
		};
	}
}
