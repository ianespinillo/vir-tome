// test/database-test.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { BookEntity } from '../book/entities/book.entity';
import { CategoryEntity } from '../book/entities/category.entity';
import { PublisherEntity } from '../book/entities/publisher.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { TokenEntity } from '../tokens/entities/tokens.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';

config(); // Cargar variables de entorno desde .env

const isCi = process.env.CI === 'true';

export const testDatabaseConfig: TypeOrmModuleOptions = {
	type: 'postgres',
	database: 'virtome_test_db',
	username: 'test',
	password: 'test',
	host: 'localhost',
	port: isCi ? 5432 : 5439, // Usar puerto 5433 en CI para evitar conflictos
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
