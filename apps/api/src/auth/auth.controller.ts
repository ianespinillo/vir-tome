import { UserEntity } from '@/users/entities/user.entity';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import {
	ApiBody,
	ApiConsumes,
	ApiCookieAuth,
	ApiOperation,
	ApiProduces,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import {
	SignInDto,
	SignUpDto,
	UpdatePasswordDto,
	UpdatePersonalDataDto,
} from '@repo/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthBearer } from './decorators/auth-bearer.decorators';
import { User } from './decorators/user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('sign-up')
	@ApiOperation({
		summary: 'User registration',
		description:
			'Creates a new user account with the provided credentials and personal information.',
	})
	@ApiConsumes('application/json')
	@ApiProduces('application/json')
	@ApiBody({
		type: SignUpDto,
		description: 'User registration data',
		required: true,
		examples: {
			basic: {
				summary: 'Basic registration',
				value: {
					email: 'user@example.com',
					name: 'John',
					surname: 'Doe',
					roleId: 1,
				},
			},
			admin: {
				summary: 'Admin registration',
				value: {
					email: 'admin@example.com',
					name: 'Admin',
					surname: 'User',
					roleId: 2,
				},
			},
		},
	})
	@ApiResponse({
		status: 201,
		description: 'User successfully registered',
		schema: {
			example: {
				id: 1,
				email: 'user@example.com',
				name: 'John',
				surname: 'Doe',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - Invalid input data',
	})
	@ApiResponse({
		status: 409,
		description: 'Conflict - Email already exists',
	})
	async signUp(@Body() body: SignUpDto) {
		return this.authService.signUp(body);
	}

	@Post('sign-in')
	@ApiOperation({
		summary: 'User authentication',
		description:
			'Authenticates user credentials and returns a JWT token. The token is also set in an HTTP-only cookie and Authorization header.',
	})
	@ApiConsumes('application/json')
	@ApiProduces('application/json')
	@ApiBody({
		type: SignInDto,
		description: 'User credentials',
		required: true,
		examples: {
			userLogin: {
				summary: 'Standard user login',
				value: {
					email: 'user@example.com',
					password: 'securePassword123',
				},
			},
			adminLogin: {
				summary: 'Admin login',
				value: {
					email: 'admin@example.com',
					password: 'adminPass123!',
				},
			},
		},
	})
	@ApiResponse({
		status: 200,
		description: 'User successfully authenticated',
		headers: {
			'Set-Cookie': {
				description: 'HTTP-only cookie containing the JWT token',
				schema: { type: 'string' },
			},
			Authorization: {
				description: 'Bearer token in the header',
				schema: { type: 'string' },
			},
		},
		schema: {
			example: {
				token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
				message: 'Login successful',
			},
		},
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - Invalid input data',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized - Invalid credentials',
	})
	@ApiCookieAuth('token')
	async signIn(
		@Body() body: SignInDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const token = await this.authService.signIn(body);
		res.setHeader('Authorization', `Bearer ${token.token}`);
		res.cookie('token', token.token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 4000, // 4 hours
		});
		return token;
	}
	@AuthBearer()
	@Get('user')
	@ApiOperation({
		summary: 'Get user information',
		description: "Retrieves the authenticated user's information.",
	})
	@ApiProduces('application/json')
	@ApiResponse({
		status: 200,
		description: 'User information retrieved successfully',
		schema: {
			example: {
				id: 1,
				email: 'user@example.com',
				name: 'John',
				surname: 'Doe',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			},
		},
	})
	@ApiCookieAuth('token')
	async getUser(@User() user: UserEntity) {
		return user;
	}

	@Post('sign-out')
	@ApiOperation({
		summary: 'User logout',
		description:
			'Logs out the user by clearing the JWT token from the HTTP-only cookie and Authorization header.',
	})
	@ApiProduces('application/json')
	@ApiResponse({
		status: 200,
		description: 'User successfully logged out',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized - User not authenticated',
	})
	@ApiCookieAuth('token')
	async signOut(@Res({ passthrough: true }) res: Response) {
		res.clearCookie('token');
		res.setHeader('Authorization', '');
		return { message: 'Logout successful' };
	}
	@AuthBearer()
	@Post('update-user')
	@ApiOperation({
		summary: 'Change user email',
		description:
			'Generates a token to confirm the email change and sends a confirmation email to the old email address.',
	})
	@ApiProduces('application/json')
	@ApiResponse({
		status: 200,
		description: 'Email change request sent successfully',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized - User not authenticated',
	})
	@ApiCookieAuth('token')
	async changeEmail(@User() user, @Body() body: UpdatePersonalDataDto) {
		return this.authService.generateChangeEmailToken(user.id, body);
	}
	@Post('confirm-email')
	@ApiOperation({
		summary: 'Confirm email change',
		description:
			"Confirms the email change using the provided token and updates the user's email address.",
	})
	@ApiProduces('application/json')
	@ApiResponse({
		status: 200,
		description: 'Email successfully changed',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized - User not authenticated',
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - Invalid token or email',
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found - User not found',
	})
	@ApiResponse({
		status: 409,
		description: 'Conflict - Email already exists',
	})
	@ApiCookieAuth('token')
	async confirmEmail(
		@Body('token') token: string,
		@Res({ passthrough: true }) res: Response,
	) {
		const isChanged = await this.authService.confirmEmail(token);
		res.clearCookie('token');
		return isChanged;
	}

	@Post('update-password')
	@ApiOperation({
		summary: 'Change user password',
		description:
			'Updates the user password using the provided old and new passwords.',
	})
	@ApiProduces('application/json')
	@ApiResponse({
		status: 200,
		description: 'Password successfully updated',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized - User not authenticated',
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - Invalid password or token',
	})
	@ApiResponse({
		status: 404,
		description: 'Not Found - User not found',
	})
	@ApiResponse({
		status: 409,
		description: 'Conflict - Passwords do not match',
	})
	@ApiCookieAuth('token')
	@AuthBearer()
	async changePassword(
		@User() user: UserEntity,
		@Body() body: UpdatePasswordDto,
		@Res({ passthrough: true }) res: Response,
	) {
		res.clearCookie('token');
		res.setHeader('Authorization', '');
		return this.authService.changePassword(user.id, body);
	}
}
