import { PASSWORD_SALT_ROUNDS } from '@repo/common';
import { compare, hash } from 'bcryptjs';

export class PasswordAdapter {
	static async generateHashedPassword(
		length: number,
	): Promise<{ password: string; hashedPassword: string }> {
		const charset =
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
		let password = '';
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charset.length);
			password += charset[randomIndex];
		}
		const hashPassword = await hash(password, 10);
		return { password, hashedPassword: hashPassword };
	}

	static hashPassword(password: string) {
		return hash(password, PASSWORD_SALT_ROUNDS);
	}

	static comparePassword(password: string, hashedPassword: string) {
		return compare(password, hashedPassword);
	}
}
