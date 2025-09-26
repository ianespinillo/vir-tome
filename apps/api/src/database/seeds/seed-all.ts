import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DemoSeeder } from './demo-tenant.seeder';

async function bootstrap() {
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
