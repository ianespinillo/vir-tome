import { BookEntity } from '@/book/entities/book.entity';
import { CategoryEntity } from '@/book/entities/category.entity';
import { PublisherEntity } from '@/book/entities/publisher.entity';
import { LoanEntity } from '@/loan/entities/loan.entity';
import { SuperAdminEntity } from '@/super-admin/entities/super-admin.entity';
import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { TokenEntity } from '@/tokens/entities/tokens.entity';
import { RoleEntity } from '@/users/entities/role.entity';
import { UserTenantEntity } from '@/users/entities/user-tenant.entity';
import { UserEntity } from '@/users/entities/user.entity';
// test/database-test.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TestContainerManager } from './test-container-manager';

// Exportamos una función async en lugar de un objeto fijo
export const getTestDatabaseConfig =
	async (): Promise<TypeOrmModuleOptions> => {
		// 1. Obtenemos las credenciales dinámicas del contenedor
		const containerOptions = await TestContainerManager.getOptions();

		// 2. Mezclamos con tus entidades y configuración base
		return {
			...containerOptions, // Host, Port, User, Pass vienen de aquí
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
			synchronize: true,
			dropSchema: true, // Cuidado: limpia todo al iniciar la conexión
			logging: false,
		};
	};
