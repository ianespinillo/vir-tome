import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from '@repo/common';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    @Post('sign-up')
    async signUp(@Body() body: SignUpDto) {
        return this.authService.signUp(body);
    }
    @Post('sign-in')
    async signIn(@Body() body: SignUpDto, @Res({ passthrough: true }) res: Response) {
        const token = await this.authService.signIn(body);
        res.setHeader('Authorization', `Bearer ${token}`);
        res.cookie('token', token, {    
            httpOnly: true,
            secure: true,
            sameSite: false,
            maxAge: 60 * 60 * 4000, // 4 hour
        });
        return { message: 'Login successful', token };
    }

}
