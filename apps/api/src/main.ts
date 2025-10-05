import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppModule } from './app.module';
// import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { AllExceptionsFilter } from './core/http-exception.filter';
import { LoanModule } from './loan/loan.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe());
	app.setGlobalPrefix('api');
	app.use(cookieParser());
	app.useGlobalFilters(new AllExceptionsFilter());
	app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	});

	/// Swagger API
	const config = new DocumentBuilder()
		.setTitle('Vir-track API')
		.setDescription('API para la gestión de libros y préstamos')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config, {
		include: [
			UsersModule,
			LoanModule,
			// AuthModule,
			BookModule,
			AnalyticsModule,
			TenantsModule,
		],
	});
	SwaggerModule.setup('api/docs', app, document);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
