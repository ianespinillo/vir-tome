import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { TenantEntity } from './tenants/entities/tenant.entity';
import { TenantGuard } from './tenants/guards/tenant.guard';
import { TenantMiddleware } from './tenants/middlewares/tenant-middleware/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { TokenEntity } from './tokens/entities/tokens.entity';
import { TokensModule } from './tokens/tokens.module';
import { RoleEntity } from './users/entities/role.entity';
import { UserEntity } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		TypeOrmModule.forRootAsync({
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				url: config.get('DATABASE_URL'),
				synchronize: false,
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
				],
			}),
			inject: [ConfigService],
			imports: [ConfigModule],
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
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: TenantGuard,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(TenantMiddleware).forRoutes('*');
		consumer.apply(DemoMiddleware).forRoutes('*');
	}
}
