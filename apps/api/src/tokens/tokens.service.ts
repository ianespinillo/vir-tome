import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenTypes } from '@repo/common';
import { Repository } from 'typeorm';
import { TokenEntity } from './entities/tokens-entity';

interface TokenOptions {
	user_id: number;
	type: TokenTypes;
	expiresInHours: number;
	metadata?: Record<string, any>;
}

@Injectable()
export class TokensService {
	constructor(
		@InjectRepository(TokenEntity)
		private readonly tokenRepository: Repository<TokenEntity>,
	) {}
	private hashToken(token: string) {
		return createHash('sha256').update(token).digest('hex');
	}
	async generateToken(options: TokenOptions) {
		const token = randomBytes(32).toString('hex');
		const tokenHash = this.hashToken(token);
		const expires = new Date(Date.now() + options.expiresInHours * 1000);
		await this.tokenRepository.save({
			user_id: options.user_id,
			metadata: options.metadata,
			expires_at: expires,
			type: options.type,
			token_hash: tokenHash,
			used_at: null,
		});
		return {
			token,
			expires,
		};
	}
	async validate({
		user_id,
		type,
		token,
	}: {
		user_id: number;
		type: TokenTypes;
		token: string;
	}) {
		const hash = this.hashToken(token);
		const existToken = await this.tokenRepository.findOne({
			where: {
				user_id,
				type,
				token_hash: hash,
			},
		});
		if (!existToken) {
			throw new BadRequestException('Token no encontrado');
		}
		if (existToken.expires_at < new Date()) {
			throw new BadRequestException('Token expirado');
		}
		return existToken;
	}
	async markAsUsed(tokenId: number) {
		return await this.tokenRepository.update(tokenId, {
			used_at: new Date(),
		});
	}
}
