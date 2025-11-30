// src/auth/auth.controller.ts
import {
	BadRequestException,
	Body,
	Controller,
	Get,
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
	ResetPasswordDto,
	SignInDto,
	SignUpDto,
} from '@repo/common';
import type { Response } from 'express';
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
	async login(
		@Body() loginDto: SignInDto,
		@Res({ passthrough: true }) res: Response,
	) {
		if (!loginDto.tenantId) throw new BadRequestException('No tenant id found');
		const { access_token, user } = await this.authService.login(
			loginDto,
			loginDto.tenantId,
		);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			secure: false,
		});
		// Returning the user allows Nest to handle sending the response while
		// we still set the cookie using the response object passed with passthrough.
		return user;
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
	async generalLogin(@Body() loginDto: SignInDto) {
		return this.authService.centralLogin(loginDto);
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
	) {
		const { access_token, user } = await this.authService.adminLogin(loginDto);
		res.cookie('access_token', access_token, {
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
		});

		// Let Nest send the final response (return body) while cookie is set via passthrough.
		return user;
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
