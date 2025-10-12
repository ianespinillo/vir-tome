import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { AppModule } from '../../app.module';
import { DemoSeeder } from './demo-tenant.seeder';
config();
process.env.SEED_MODE = 'true';
export async function bootstrap() {
	console.log('🌱 Starting complete seeding...');

	const app = await NestFactory.createApplicationContext(AppModule);
	const seeder = app.get(DemoSeeder);

	try {
		// Seed demo data
		await seeder.seed();

		// TODO: Add other seeders here
		// await productionSeeder.seed();

		console.log('✅ All seeding completed successfully');
	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	} finally {
		await app.close();
	}
}

bootstrap();
