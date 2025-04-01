import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import {JwtModule} from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config';
@Module({
  providers: [ConfigService, AuthService, JwtStrategy],
  controllers: [AuthController],
  imports: [UsersModule, JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  })],
})
export class AuthModule {}
