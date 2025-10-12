// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Request } from '@nestjs/common';
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
	ResetPasswordDto,
	SignInDto,
	SignUpDto,
} from '@repo/common';
import { AuthService } from './auth.service';
import { AuthBearer } from './decorators/auth-bearer.decorators';

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
	async login(@Body() loginDto: SignInDto, @Request() req) {
		return this.authService.login(loginDto, req.tenantId);
	}

	@Post('register')
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
	async register(@Body() registerDto: SignUpDto, @Request() req) {
		return this.authService.register(registerDto, req.tenantId);
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
	async forgotPassword(@Body() dto: ForgotPasswordDTO, @Request() req) {
		return this.authService.forgotPassword(dto, req.tenantId);
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
	async resetPassword(@Body() dto: ResetPasswordDto, @Request() req) {
		return this.authService.resetPassword(dto, req.tenantId);
	}

	@Get('profile')
	@AuthBearer()
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
	getProfile(@Request() req) {
		return {
			user: req.user,
			tenant: req.tenant,
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
	async refresh(@Request() req) {
		return this.authService.refreshToken(req.user.userId, req.user.tenantId);
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
