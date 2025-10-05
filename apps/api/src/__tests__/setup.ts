import { DataSource } from 'typeorm';
import { testDatabaseConfig } from './database-test.config';

let dataSource: DataSource;

beforeAll(async () => {
	console.log('🧪 Initializing test database...');

	if (dataSource?.isInitialized) {
		await dataSource.destroy();
	}
	console.log(testDatabaseConfig);
	// Creamos una nueva instancia de DataSource a partir del config
	dataSource = new DataSource({
		...testDatabaseConfig,
		synchronize: true,
		dropSchema: true,
		logging: false,
	} as any);

	try {
		await dataSource.query('DROP TYPE IF EXISTS "role_entity_name_enum" CASCADE');
	} catch (error) {
		console.error(error);
	}
	try {
		await dataSource.initialize();
		console.log('✅ Test database initialized');
	} catch (error) {
		console.error('❌ Failed to initialize test database:', error);
		throw error;
	}
}, 30000);

afterAll(async () => {
	if (dataSource?.isInitialized) {
		await dataSource.destroy();
	}
});

export const getTestDataSource = () => {
	if (!dataSource?.isInitialized) {
		throw new Error('DataSource not initialized');
	}
	return dataSource;
};
