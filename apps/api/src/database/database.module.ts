// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { CategoryEntity } from '../book/entities/category.entity';
import { PublisherEntity } from '../book/entities/publisher.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DemoSeeder } from './seeds/demo-tenant.seeder';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			TenantEntity,
			UserEntity,
			RoleEntity,
			BookEntity,
			CategoryEntity,
			PublisherEntity,
			LoanEntity,
		]),
	],
	providers: [DemoSeeder],
	exports: [DemoSeeder],
})
export class DatabaseModule {}
