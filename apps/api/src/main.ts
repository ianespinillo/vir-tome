import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { AllExceptionsFilter } from './core/http-exception.filter';
import { DemoModule } from './demo/demo.module';
import { LoanModule } from './loan/loan.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
async function bootstrap() {
	console.log('Starting Vir-tome API...');
	const app = await NestFactory.create(AppModule);
	console.log('Applying global configurations...');
	app.useGlobalPipes(new ValidationPipe());
	app.setGlobalPrefix('api');
	app.useGlobalFilters(new AllExceptionsFilter());
	app.use(cookieParser());

	app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	});

	/// Swagger API
	const config = new DocumentBuilder()
		.setTitle('Vir-tome API')
		.setDescription('API para la gestión de libros y préstamos')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config, {
		include: [
			UsersModule,
			LoanModule,
			AuthModule,
			DemoModule,
			BookModule,
			AnalyticsModule,
			TenantsModule,
			SuperAdminModule,
			UsersModule,
		],
	});
	SwaggerModule.setup('api/docs', app, document);
	await app.listen(process.env.PORT ?? 3000);
	console.log(
		`API is running on http://localhost:${process.env.PORT ?? 3000}/api`,
	);
}
bootstrap();
