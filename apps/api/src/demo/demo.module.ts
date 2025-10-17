// src/demo/demo.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { CategoryEntity } from '../book/entities/category.entity';
import { PublisherEntity } from '../book/entities/publisher.entity';
import { DemoSeeder } from '../database/seeds/demo-tenant.seeder';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DemoResetService } from './demo-reset.service';
import { DemoController } from './demo.controller';
import { DemoMiddleware } from './middleware/demo.middleware';

@Module({
	imports: [
		ScheduleModule.forRoot(),
		TypeOrmModule.forFeature([
			TenantEntity,
			UserEntity,
			BookEntity,
			LoanEntity,
			CategoryEntity,
			PublisherEntity,
			RoleEntity,
		]),
	],
	controllers: [DemoController],
	providers: [DemoResetService, DemoSeeder, DemoMiddleware],
	exports: [DemoResetService],
})
export class DemoModule {}
