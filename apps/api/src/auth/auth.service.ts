import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/services/users.service';
import { SignInDto } from '../../../../packages/common/src/dto/auth/sign-in.dto';
import { IAuthPayload, SignUpDto } from '@repo/common';
import { PasswordAdapter } from 'src/core/passport-adapter';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

    async signUp(payload: SignUpDto) {
        const user = await this.usersService.findUserByEmail(payload.email);
        if (user) {
            throw new BadRequestException('Email ya en uso');
        }
        return await this.usersService.createUser(payload);
    }
    async signIn(payload: SignInDto) {
        const user = await this.usersService.findUserByEmail(payload.email);
        if (!user) {
            throw new BadRequestException('Email no encontrado');
        }
        const isPasswordValid = await PasswordAdapter.comparePassword(
            payload.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new BadRequestException('Contraseña incorrecta');
        }
        const jwtPayload : IAuthPayload = {
            sub: user.id,
            email: user.email,
        }
        const token = this.jwtService.sign(jwtPayload);
        return token.toString();
    } 

}
