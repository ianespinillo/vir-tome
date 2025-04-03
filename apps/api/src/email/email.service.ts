import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { EmailWelcome } from './types';

@Injectable()
export class EmailService {
	constructor(private readonly emailService: MailerService) {}

	async sendEmailWelcome({ to, password }: EmailWelcome) {
		await this.emailService.sendMail({
			to,
			subject: 'Bienvenido a vir-track',
			template: './welcome',
			context: {
				password,
			},
		});
	}
}
