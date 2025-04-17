import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { UsersModule } from './users/users.module';
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe());
	app.setGlobalPrefix('api');
	await app.enableCors({
		origin: 'http://localhost:3000',
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	});
	app.use(cookieParser());

	/// Swagger API
	const config = new DocumentBuilder()
		.setTitle('Vir-track API')
		.setDescription('API para la gestión de libros y préstamos')
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config, {
		include: [UsersModule, LoanModule, AuthModule, BookModule],
	});
	SwaggerModule.setup('api/docs', app, document);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
