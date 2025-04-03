import { join } from 'node:path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
	imports: [
		ConfigModule,
		MailerModule.forRootAsync({
			useFactory: async (configService: ConfigService) => ({
				transport: {
					host: configService.get('SMTP_HOST'),
					port: configService.get('SMTP_PORT'),
					auth: {
						user: configService.get('SMTP_USER'),
						pass: configService.get('SMTP_PASSWORD'),
					},
				},
				defaults: {
					from: configService.get('SMTP_FROM'),
				},
				template: {
					dir: join(process.cwd(), 'templates'),
					adapter: new HandlebarsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
			inject: [ConfigService],
			imports: [ConfigModule],
		}),
	],
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
