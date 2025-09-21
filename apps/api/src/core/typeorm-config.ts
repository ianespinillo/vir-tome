import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
// src/config/database.config.ts
import { BookEntity } from '../book/entities/book.entity';
import { CategoryEntity } from '../book/entities/category.entity';
import { PublisherEntity } from '../book/entities/publisher.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { TokenEntity } from '../tokens/entities/tokens.entity';
import { RoleEntity } from '../users/entities/role.entity';
import { UserEntity } from '../users/entities/user.entity';
// Configuración para migraciones
config();
const AppDataSource = new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	entities: [
		'src/**/*.entity.ts', // Patrón que encuentra todas las entidades
	],
	migrations: ['src/migrations/*.ts'],
	migrationsTableName: 'migrations',
	synchronize: false,
	logging: ['error', 'warn', 'migration'],
});

// Export default para usar en scripts de migración
export default AppDataSource;
