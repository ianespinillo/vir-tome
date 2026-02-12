import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TokensModule } from '../tokens/tokens.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MultitenantGuard } from './guard/multitenant.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
@Module({
	providers: [ConfigService, AuthService, JwtStrategy, MultitenantGuard],
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
		SuperAdminModule,
	],
})
export class AuthModule {}
