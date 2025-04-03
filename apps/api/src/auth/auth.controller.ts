import { Body, Controller, Post, Res } from '@nestjs/common';
import {
	ApiBody,
	ApiConsumes,
	ApiCookieAuth,
	ApiOperation,
	ApiProduces,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { SignInDto, SignUpDto } from '@repo/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

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
		res.setHeader('Authorization', `Bearer ${token}`);
		res.cookie('token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 4000, // 4 hours
		});
		return { message: 'Login successful', token };
	}
}
