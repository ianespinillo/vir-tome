import { EmailModule } from '@/email/email.module';
import { TenantsModule } from '@/tenants/tenants.module';
import { TokensModule } from '@/tokens/tokens.module';
import { UsersModule } from '@/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
	providers: [ConfigService, AuthService, JwtStrategy],
	controllers: [AuthController],
	imports: [
		UsersModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '4h' },
			}),
		}),
		EmailModule,
		TokensModule,
		TenantsModule,
	],
})
export class AuthModule {}
