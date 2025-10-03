// src/auth/auth.controller.ts
import {
	Body,
	Controller,
	Get,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from '@repo/common';
import { AuthService } from './auth.service';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * Login
	 * El tenant_id viene automáticamente de req.tenantId (inyectado por middleware)
	 */
	@Post('login')
	async login(@Body() loginDto: SignInDto, @Request() req) {
		// req.tenantId viene del TenantMiddleware
		return this.authService.login(loginDto, req.tenantId);
	}

	/**
	 * Register
	 * El tenant_id viene del middleware
	 */
	@Post('register')
	async register(@Body() registerDto: SignUpDto, @Request() req) {
		return this.authService.register(registerDto, req.tenantId);
	}

	/**
	 * Get current user profile
	 * Protegido con JWT, incluye validación de tenant
	 */
	@Get('profile')
	//   @UseGuards(JwtAuthGuard)
	getProfile(@Request() req) {
		return {
			user: req.user,
			tenant: req.tenant,
		};
	}

	/**
	 * Refresh token
	 */
	@Post('refresh')
	//   @UseGuards(JwtAuthGuard)
	async refresh(@Request() req) {
		return this.authService.refreshToken(req.user.userId, req.user.tenantId);
	}

	/**
	 * Logout
	 * Aquí podrías invalidar el token si usas una blacklist
	 */
	@Post('logout')
	//   @UseGuards(JwtAuthGuard)
	async logout() {
		return {
			message: 'Logout successful',
		};
	}
}
