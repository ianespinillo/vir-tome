import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { BookEntity } from './book/entities/book.entity';
import { CategoryEntity } from './book/entities/category.entity';
import { PublisherEntity } from './book/entities/publisher.entity';
import { DatabaseModule } from './database/database.module';
import { DemoModule } from './demo/demo.module';
import { DemoMiddleware } from './demo/middleware/demo.middleware';
import { EmailModule } from './email/email.module';
import { LoanEntity } from './loan/entities/loan.entity';
import { LoanModule } from './loan/loan.module';
import { SuperAdminEntity } from './super-admin/entities/super-admin.entity';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantEntity } from './tenants/entities/tenant.entity';
import { TenantMiddleware } from './tenants/middlewares/tenant-middleware/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { TokenEntity } from './tokens/entities/tokens.entity';
import { TokensModule } from './tokens/tokens.module';
import { RoleEntity } from './users/entities/role.entity';
import { UserTenantEntity } from './users/entities/user-tenant.entity';
import { UserEntity } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		TypeOrmModule.forRootAsync({
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				url: config.get('DATABASE_URL'),
				synchronize: true,
				logger: 'simple-console',
				entities: [
					UserEntity,
					RoleEntity,
					LoanEntity,
					BookEntity,
					PublisherEntity,
					CategoryEntity,
					TokenEntity,
					TenantEntity,
					SuperAdminEntity,
					UserTenantEntity,
				],
			}),
			inject: [ConfigService],
			imports: [ConfigModule],
		}),
		JwtModule.registerAsync({
			inject: [ConfigService],
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '4h' },
			}),
		}),
		UsersModule,
		LoanModule,
		BookModule,
		AuthModule,
		EmailModule,
		AnalyticsModule,
		TokensModule,
		TenantsModule,
		DatabaseModule,
		DemoModule,
		SuperAdminModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		/*{
			provide: APP_GUARD,
			useClass: TenantGuard,
		},*/
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(TenantMiddleware)
			.exclude('/auth/*', '/demo/*', '/tenants/subdomain/*')
			.forRoutes('*');
		consumer.apply(DemoMiddleware).forRoutes('*');
	}
}
