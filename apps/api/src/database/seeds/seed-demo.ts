import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from '../../app.module';
import { DemoSeeder } from '../seeds/demo-tenant.seeder';

if (process.env.NODE_ENV === 'test') {
	dotenv.config({ path: '.env.test' });
} else {
	dotenv.config();
}
async function bootstrap() {
	console.log('🌱 Starting demo seeding...');

	const app = await NestFactory.createApplicationContext(AppModule);
	const seeder = app.get(DemoSeeder);

	try {
		await seeder.seed();
		console.log('✅ Demo seeding completed successfully');
	} catch (error) {
		console.error('❌ Demo seeding failed:', error);
		process.exit(1);
	} finally {
		await app.close();
	}
}

bootstrap();
