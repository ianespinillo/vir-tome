import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { BookEntity } from './book/entities/book.entity';
import { CategoryEntity } from './book/entities/category.entity';
import { PublisherEntity } from './book/entities/publisher.entity';
import { EmailModule } from './email/email.module';
import { LoanEntity } from './loan/entities/loan.entity';
import { LoanModule } from './loan/loan.module';
import { RoleEntity } from './users/entities/role.entity';
import { UserEntity } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { TokenEntity } from './tokens/entities/tokens-entity';

@Module({
	imports: [
		ConfigModule.forRoot(),
		TypeOrmModule.forRootAsync({
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				url: config.get('DATABASE_URL'),
				synchronize: true,
				entities: [
					UserEntity,
					RoleEntity,
					LoanEntity,
					BookEntity,
					PublisherEntity,
					CategoryEntity,
					TokenEntity
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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
