// src/auth/auth.controller.ts
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	HttpStatus,
	Post,
	Request,
	Res,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
	ForgotPasswordDTO,
	IApiResponse,
	IGeneralLoginResponse,
	ILoginResponse,
	IMessageResponse,
	IRequestUser,
	ISignUpResponse,
	ResetPasswordDto,
	SignInDto,
	SignUpDto,
} from '@repo/common';
import type { Request as IRequest, Response } from 'express';
import { getCookieDomain } from '../core/cookie-helper';
import { IAuthUser } from '../core/core.types';
import { AuthService } from './auth.service';
import { AuthBearer } from './decorators/auth-bearer.decorators';
import { User } from './decorators/user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@ApiOperation({
		summary: 'Login to tenant',
		description:
			'Authenticate user within their tenant. Requires X-Tenant-ID header or subdomain.',
	})
	@ApiResponse({
		status: 201,
		description: 'Login successful. Returns access token and user info.',
	})
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	@ApiBadRequestResponse({ description: 'Tenant not found or inactive' })
	async login(
		@Body() loginDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<IApiResponse<ILoginResponse>> {
		if (!loginDto.tenantId) throw new BadRequestException('No tenant id found');
		const { access_token, user } = await this.authService.login(
			loginDto,
			loginDto.tenantId,
		);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			secure: false,
			expires: new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
			sameSite: 'none',
		});
		// Returning the user allows Nest to handle sending the response while
		// we still set the cookie using the response object passed with passthrough.
		return {
			message: 'Login successful',
			data: {
				access_token,
				user,
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
	@AuthBearer()
	@Post('switch-tenant')
	@ApiOperation({
		summary: 'Switch Tenant',
		description:
			'Switch tenant context for users with access to multiple tenants.',
	})
	@ApiResponse({
		status: 201,
		description: 'Tenant switched successfully. Returns new access token.',
	})
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	async switchTenant(
		@Body() dto: { tenantId: number },
		@User() user: IAuthUser,
		@Res({ passthrough: true }) res: Response,
	): Promise<IApiResponse<ILoginResponse>> {
		const { access_token, user: updatedUser } =
			await this.authService.switchTenant(user.id, dto.tenantId);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			secure: false,
			expires: new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
			sameSite: 'none',
		});
		return {
			message: 'Tenant switched successfully',
			data: {
				access_token,
				user: updatedUser,
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('general-login')
	@ApiOperation({
		summary: 'General Login',
		description:
			'Authenticate user without tenant context. Use for global users.',
	})
	@ApiResponse({
		status: 201,
		description: 'Login successful. Returns access token and user info.',
	})
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	async generalLogin(
		@Body() loginDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<IApiResponse<IGeneralLoginResponse>> {
		const result = await this.authService.centralLogin(loginDto);
		if (result.requiresTenantSelection === false && 'tenant' in result) {
			res.cookie('access_token', result.access_token, {
				httpOnly: true,
				expires: new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
				secure: false,
				sameSite: 'none',
			});
		}
		return {
			message: 'Login successful',
			data: result,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@ApiOperation({
		summary: 'Login as Super Admin',
		description: 'Authenticate as a Super Admin user.',
	})
	@ApiResponse({
		status: 201,
		description: 'Login successful. Returns access token and user info.',
	})
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	@Post('admin-login')
	async adminLogin(
		@Body() loginDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<IApiResponse<ILoginResponse>> {
		const { access_token, user } = await this.authService.adminLogin(loginDto);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			expires: new Date(new Date().getTime() + 4 * 60 * 60 * 1000),
			secure: false,
			sameSite: 'none',
		});

		// Let Nest send the final response (return body) while cookie is set via passthrough.
		return {
			message: 'Login successful',
			data: {
				access_token,
				user,
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}
	@ApiOperation({
		summary: 'Register new user',
		description:
			'Create a new user in the tenant. Admin creates users with temporary password.',
	})
	@ApiResponse({
		status: 201,
		description:
			'User registered successfully. Returns access token and temporary password.',
	})
	@ApiBadRequestResponse({ description: 'Email already exists in tenant' })
	@Post('register')
	async register(
		@Body() registerDto: SignUpDto,
		@User() user: IAuthUser,
	): Promise<IApiResponse<ISignUpResponse>> {
		const res = await this.authService.register(
			registerDto,
			registerDto.tenantId || user.tenantId,
		);
		return {
			message: 'User registered successfully',
			data: res,
			status: HttpStatus.CREATED,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('forgot-password')
	@ApiOperation({
		summary: 'Request password reset',
		description:
			'Generate password reset token. Email will be sent if user exists.',
	})
	@ApiResponse({
		status: 201,
		description: 'Reset link sent if email exists',
	})
	async forgotPassword(
		@Body() dto: ForgotPasswordDTO,
		@Request() req,
	): Promise<IApiResponse<IMessageResponse>> {
		const data = await this.authService.forgotPassword(dto, req.tenantId);
		return {
			message: 'Reset link sent if email exists',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('reset-password')
	@ApiOperation({
		summary: 'Reset password with token',
		description: 'Reset user password using the token from forgot-password',
	})
	@ApiResponse({
		status: 201,
		description: 'Password reset successful',
	})
	@ApiBadRequestResponse({ description: 'Invalid or expired token' })
	async resetPassword(
		@Body() dto: ResetPasswordDto,
		@Request() req,
	): Promise<IApiResponse<IMessageResponse>> {
		const data = await this.authService.resetPassword(dto, req.tenantId);
		return {
			message: 'Password reseted successfully',
			data,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get current user profile',
		description: 'Returns authenticated user information and tenant details',
	})
	@ApiResponse({
		status: 200,
		description: 'User profile retrieved successfully',
	})
	@ApiUnauthorizedResponse({ description: 'Not authenticated' })
	@AuthBearer()
	@Get('session')
	getProfile(@User() user: IAuthUser): IApiResponse<IAuthUser> {
		if (!user) throw new BadRequestException('Not authenticated');
		return {
			message: 'User profile retrieved successfully',
			data: user,
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('refresh')
	@AuthBearer()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Refresh access token',
		description: 'Generate new access token using existing valid token',
	})
	@ApiResponse({
		status: 201,
		description: 'New access token generated',
	})
	@ApiUnauthorizedResponse({ description: 'Invalid token' })
	async refresh(
		@Request() req,
		@Res({ passthrough: true }) res: Response,
	): Promise<IApiResponse<{ access_token: string }>> {
		const { access_token } = await this.authService.refreshToken(
			req.user.userId,
			req.user.tenantId,
		);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			secure: false,
			sameSite: 'none',
		});
		return {
			message: 'New access token generated',
			data: {
				access_token,
			},
			status: HttpStatus.OK,
			timestamp: new Date().toISOString(),
		};
	}

	@Post('logout')
	@AuthBearer()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Logout user',
		description: 'Logout current user (client should discard token)',
	})
	@ApiResponse({
		status: 201,
		description: 'Logout successful',
	})
	async logout() {
		return {
			message: 'Logout successful',
		};
	}
}
