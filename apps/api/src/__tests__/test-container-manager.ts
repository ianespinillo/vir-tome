import { TypeOrmModuleOptions } from '@nestjs/typeorm';
// test/test-container-manager.ts
import {
	PostgreSqlContainer,
	StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Wait } from 'testcontainers';

export class TestContainerManager {
	private static container: StartedPostgreSqlContainer;
	private static isStarting = false;

	// Método estático para obtener o iniciar el contenedor
	static async getOptions(): Promise<TypeOrmModuleOptions> {
		// Si ya existe, devolvemos la config directamente (Singleton)
		if (TestContainerManager.container) {
			return TestContainerManager.createConnectionConfig();
		}

		// Evitar condiciones de carrera si dos tests llaman a esto al mismo tiempo
		if (TestContainerManager.isStarting) {
			// Esperar un poco a que el otro proceso termine de iniciarlo
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (TestContainerManager.container)
				return TestContainerManager.createConnectionConfig();
		}

		TestContainerManager.isStarting = true;

		try {
			TestContainerManager.container = await new PostgreSqlContainer(
				'postgres:14-alpine',
			)
				.withDatabase('virtome_test_db')
				.withUsername('test')
				.withPassword('test')
				// El fix clave para que no falle al conectar
				.withWaitStrategy(
					Wait.forLogMessage(/database system is ready to accept connections/),
				)
				.withReuse() // Opcional: ayuda si usas watch mode
				.start();

			return TestContainerManager.createConnectionConfig();
		} finally {
			TestContainerManager.isStarting = false;
		}
	}

	// Genera la config compatible con TypeORM
	private static createConnectionConfig(): TypeOrmModuleOptions {
		return {
			type: 'postgres',
			host: '127.0.0.1', // El fix de IPv4
			port: TestContainerManager.container.getPort(),
			username: TestContainerManager.container.getUsername(),
			password: TestContainerManager.container.getPassword(),
			database: TestContainerManager.container.getDatabase(),
			// Tus configuraciones de performance
			connectTimeoutMS: 10000,
			extra: {
				max: 5,
				min: 1,
				acquire: 10000,
				idle: 10000,
			},
		};
	}

	static async stop() {
		if (TestContainerManager.container) {
			await TestContainerManager.container.stop();
		}
	}
}
