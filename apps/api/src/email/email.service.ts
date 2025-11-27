import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {
	ChangeEmailRequest,
	ConfirmEmailChange,
	EmailWelcome,
	ForgotPasswordEmail,
	WelcomeToTenantEmail,
} from '@repo/common';

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
	async sendEmailChangeEmail({
		confirmation_url,
		expiration,
		name,
		new_email,
		old_email,
		token,
	}: ChangeEmailRequest) {
		await this.emailService.sendMail({
			to: old_email,
			subject: 'Cambio de correo electronico',
			template: './change-email',
			context: {
				confirmation_url,
				expiration,
				name,
				new_email,
				old_email,
				token,
				actual_year: new Date().getFullYear(),
			},
		});
	}
	async sendEmailChangeConfirmation({ name, new_email }: ConfirmEmailChange) {
		await this.emailService.sendMail({
			to: new_email,
			subject: 'Confirmacion de cambio de correo electronico',
			template: './confirm-email',
			context: {
				name,
				new_email,
				actual_year: new Date().getFullYear(),
			},
		});
	}
	async forgotPasswordEmail({ email, token, expires }: ForgotPasswordEmail) {
		await this.emailService.sendMail({
			to: email,
			subject: 'Recuperación de contraseña',
			template: './forgot-password',
			context: {
				email,
				token,
				expires: new Date(expires).toLocaleDateString(),
				actual_year: new Date().getFullYear(),
			},
		});
	}
	async welcomeToTenantEmail({
		email,
		tenantName,
		userName,
		isNewUser,
		loginUrl,
	}: WelcomeToTenantEmail) {
		await this.emailService.sendMail({
			to: email,
			subject: 'Bienvenido a tu nuevo tenant',
			template: './welcome-to-tenant',
			context: {
				email,
				tenantName,
				userName,
				isNewUser,
				loginUrl,
				actualYear: new Date().getFullYear(),
			},
		});
	}
}
