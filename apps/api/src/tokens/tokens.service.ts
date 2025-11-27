import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenTypes } from '@repo/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { TokenEntity } from './entities/tokens.entity';

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
		const expires = new Date(
			Date.now() + options.expiresInHours * 60 * 60 * 1000,
		); // ✅ Fix: horas a milisegundos

		await this.tokenRepository.save({
			user_id: options.user_id,
			metadata: options.metadata,
			expires_at: expires,
			type: options.type,
			token_hash: tokenHash,
			used_at: null,
		});

		return { token, expires };
	}

	// ✅ MÉTODO ACTUALIZADO: Con validación de tenant
	async validate({
		user_id,
		type,
		token,
		tenantId, // Nuevo parámetro
	}: {
		user_id: number;
		type: TokenTypes;
		token: string;
		tenantId: number;
	}) {
		const hash = this.hashToken(token);
		const existToken = await this.tokenRepository.findOne({
			where: { user_id, type, token_hash: hash },
			relations: ['user'], // Cargar user para validar tenant
		});

		if (!existToken) throw new BadRequestException('Token no encontrado');

		// Validación de tenant
		if (existToken.user.hasAccessToTenant(tenantId) === false) {
			throw new BadRequestException('Token no válido para este tenant');
		}

		if (existToken.expires_at < new Date()) {
			throw new BadRequestException('Token expirado');
		}

		return existToken;
	}

	// ✅ NUEVO MÉTODO: Validación específica para multi-tenant
	async validateToken(token: string, tenantId: number): Promise<TokenEntity> {
		const hash = this.hashToken(token);

		const existToken = await this.tokenRepository.findOne({
			where: { token_hash: hash },
			relations: ['user'],
		});

		if (!existToken) throw new BadRequestException('Token no encontrado');
		if (existToken.user.hasAccessToTenant(tenantId) === false)
			throw new BadRequestException('Token no válido para este tenant');
		if (existToken.expires_at < new Date())
			throw new BadRequestException('Token expirado');
		if (existToken.used_at) throw new BadRequestException('Token ya utilizado');

		return existToken;
	}

	async markAsUsed(tokenId: string, tenantId?: number) {
		if (tenantId) {
			const token = await this.tokenRepository.findOne({
				where: { id: tokenId },
				relations: ['user'],
			});

			if (token && token.user.hasAccessToTenant(tenantId) === false) {
				throw new BadRequestException('Token no pertenece a este tenant');
			}
		}

		return await this.tokenRepository.update(tokenId, {
			used_at: new Date(),
		});
	}

	// ✅ NUEVO: Cleanup automático por tenant
	async cleanupExpiredTokens(tenantId: number): Promise<number> {
		const result = await this.tokenRepository
			.createQueryBuilder('token')
			.innerJoin('token.user', 'user')
			.where('user.tenant_id = :tenantId', { tenantId })
			.andWhere('token.expires_at < :now', { now: new Date() })
			.delete()
			.execute();

		return result.affected || 0;
	}

	// ✅ NUEVO: Contar tokens por tenant
	async countTokensByTenant(tenantId: number): Promise<number> {
		return await this.tokenRepository
			.createQueryBuilder('token')
			.innerJoin('token.user', 'user')
			.where('user.tenant_id = :tenantId', { tenantId })
			.getCount();
	}
}
