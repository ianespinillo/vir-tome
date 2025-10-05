import { PasswordAdapter } from '@/core/passport-adapter';
import { EmailService } from '@/email/email.service';
import { TokensService } from '@/tokens/tokens.service';
// src/auth/auth.service.ts
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { JwtService } from '@nestjs/jwt';
import {
	ForgotPasswordDTO,
	IAuthPayload,
	SignInDto as LoginDto,
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
	) {}

	/**
	 * Login multi-tenant
	 * @param loginDto - Email y password
	 * @param tenantId - Extraído del middleware (req.tenantId)
	 */
	async login(loginDto: LoginDto, tenantId: number) {
		// Validar usuario dentro del tenant específico
		const user = await this.validateUser(
			loginDto.email,
			loginDto.password,
			tenantId,
		);

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Generar JWT con tenant_id incluido
		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			tenantId: user.tenant_id,
			roleId: user.role.id,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname, // ✅ Agregado
				tenant_id: user.tenant_id,
				roleId: user.role.id,
			},
		};
	}

	/**
	 * Validar usuario por tenant
	 * CRÍTICO: Filtra por tenant_id para evitar cross-tenant access
	 */
	private async validateUser(email: string, password: string, tenantId: number) {
		// Buscar user SOLO en el tenant especificado
		const user = await this.usersService.findOne(tenantId, { email });

		if (!user) {
			return null;
		}

		// Validar password
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return null;
		}

		return user;
	}

	/**
	 * Registro multi-tenant
	 * @param registerDto - Datos del usuario
	 * @param tenantId - Extraído del middleware
	 */
	async register(registerDto: SignUpDto, tenantId: number) {
		// Validar que email es único DENTRO del tenant
		const existingUser = await this.usersService.findOne(tenantId, {
			email: registerDto.email,
		});

		if (existingUser) {
			throw new BadRequestException('Email already exists in this tenant');
		}

		// ⚠️ FIX: Generar password random y hashearlo
		const randomPassword = await PasswordAdapter.generateHashedPassword(8);

		// Crear usuario con tenant_id
		const user = await this.usersService.create(tenantId, {
			email: registerDto.email,
			name: registerDto.name,
			surname: registerDto.surname,
			password: randomPassword.hashedPassword,
			role: {
				id: registerDto.roleId,
			},
			tenant_id: tenantId,
		});

		// ⚠️ FIX: No puedes hacer login con el hash, necesitas la password original
		// Opción 1: Devolver el token directamente sin re-login
		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			tenantId: user.tenant_id,
			roleId: user.role.id,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				surname: user.surname,
				tenant_id: user.tenant_id,
				roleId: user.role.id,
			},
			// 🆕 Opcional: Devolver password temporal para que el usuario la cambie
			temporary_password: randomPassword,
		};
	}

	/**
	 * Validar JWT y extraer datos del usuario
	 * Usado por el JWT Strategy (Issue #22)
	 */
	async validateJwtPayload(payload: IAuthPayload) {
		// Buscar usuario con tenant_id del token
		const user = await this.usersService.findById(payload.tenantId, payload.sub);

		if (!user) {
			throw new UnauthorizedException('User not found in tenant');
		}

		return {
			userId: user.id,
			email: user.email,
			tenantId: user.tenant_id,
			roleId: user.role.id, // ✅ roleId en lugar de roles
			roleName: user.role.name, // ✅ Para usar en decoradores
		};
	}

	/**
	 * Refresh token multi-tenant
	 */
	async refreshToken(userId: number, tenantId: number) {
		const user = await this.usersService.findById(tenantId, userId);

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		const payload: IAuthPayload = {
			sub: user.id,
			email: user.email,
			roleId: user.role.id,
			tenantId: user.tenant_id,
		};

		return {
			access_token: this.jwtService.sign(payload),
		};
	}
	async forgotPassword({ email }: ForgotPasswordDTO, tenantId: number) {
		const user = await this.usersService.findUserByEmail(email, tenantId);
		if (!user) return { message: 'If email exists, reset link sent' };
		const token = await this.tokensService.generateToken({
			expiresInHours: 1,
			user_id: user.id,
			type: TokenTypes.FORGOT_PASSWORD,
			metadata: { tenantId },
		});
		await this.emailService.forgotPasswordEmail({
			email,
			token: token.token,
			expires: new Date(Date.now() + 1000),
		});
	}
	async resetPassword(
		{ token, newPassword }: ResetPasswordDto,
		tenantId: number,
	) {
		const validToken = await this.tokensService.validateToken(token, tenantId);
		if (validToken.metadata?.tenantId !== tenantId)
			throw new BadRequestException('Invalid token for tenant');
		const user = await this.usersService.findById(tenantId, validToken.user_id);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		try {
			const newHashedPassword = await PasswordAdapter.hashPassword(newPassword);
			await this.usersService.update(tenantId, validToken.user_id, {
				password: newHashedPassword,
			});
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
}
