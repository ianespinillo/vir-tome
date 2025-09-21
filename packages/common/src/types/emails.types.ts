export interface ChangeEmailRequest {
	old_email: string;
	new_email: string;
	token: string;
	confirmation_url: string;
	name: string;
	expiration: string;
}

export interface EmailWelcome {
	to: string;
	password: string;
}

export interface ConfirmEmailChange {
	name: string;
	new_email: string;
}

export interface ForgotPasswordEmail {
	email: string;
	token: string;
	expires: Date;
}
