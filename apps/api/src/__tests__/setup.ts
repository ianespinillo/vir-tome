import { DataSource } from 'typeorm';
import { testDatabaseConfig } from './database-test.config';

let dataSource: DataSource;

beforeAll(async () => {
	dataSource = new DataSource(testDatabaseConfig as any);
	await dataSource.initialize();
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
