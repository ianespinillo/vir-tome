// test/database-test.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BookEntity } from '../book/entities/book.entity';
import { CategoryEntity } from '../book/entities/category.entity';
import { PublisherEntity } from '../book/entities/publisher.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { TokenEntity } from '../tokens/entities/tokens.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';

export const testDatabaseConfig: TypeOrmModuleOptions = {
	type: 'postgres',
	database: 'virtome_test_db',
	username: 'test',
	password: 'test',
	host: 'localhost',
	port: 5439,
	entities: [
		TenantEntity,
		UserEntity,
		RoleEntity,
		BookEntity,
		CategoryEntity,
		PublisherEntity,
		LoanEntity,
		TokenEntity,
	],
	synchronize: true,
	dropSchema: true,
	logging: false,
	// Configuraciones para reducir timeouts
	connectTimeoutMS: 10000,
	// Pool settings para tests
	poolSize: 5,
	extra: {
		max: 5,
		min: 1,
		acquire: 10000,
		idle: 10000,
	},
};
