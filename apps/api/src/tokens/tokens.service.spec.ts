import { TenantEntity } from '@/tenants/entities/tenant.entity';
import { RoleEntity } from '@/users/entities/role.entity';
import { BadRequestException } from '@nestjs/common';
// src/tokens/services/tokens.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenTypes } from '@repo/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { TokenEntity } from './entities/tokens.entity';
import { TokensService } from './tokens.service';

describe('TokensService', () => {
	let tokensService: TokensService;
	let tokenRepository: Repository<TokenEntity>;

	const mockTokenRepository = {
		save: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		createQueryBuilder: jest.fn(),
	};

	const mockUser: UserEntity = {
		id: 1,
		tenant_id: 1,
		name: 'Test User',
		email: 'test@example.com',
		password: 'hashedpassword',
		created_at: new Date(),
		updated_at: new Date(),
		tokens: [],
		role: {} as RoleEntity,
		surname: 'User',
		tenant: {} as TenantEntity,
	};

	const mockToken: TokenEntity = {
		id: 'token-uuid-123',
		user_id: 1,
		user: mockUser,
		type: TokenTypes.CHANGE_EMAIL,
		token_hash: 'hashed-token',
		expires_at: new Date(Date.now() + 3600000), // 1 hora en el futuro
		used_at: null,
		created_at: new Date(),
		updated_at: new Date(),
		metadata: undefined,
		getTenantId: async () => 1, // Mock implementation
	};

	const expiredToken: TokenEntity = {
		...mockToken,
		expires_at: new Date(Date.now() - 3600000), // 1 hora en el pasado
		getTenantId: async () => 1, // Mock implementation
	};

	const usedToken: TokenEntity = {
		...mockToken,
		used_at: new Date(),
		getTenantId: async () => 1, // Mock implementation
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TokensService,
				{
					provide: getRepositoryToken(TokenEntity),
					useValue: mockTokenRepository,
				},
			],
		}).compile();

		tokensService = module.get<TokensService>(TokensService);
		tokenRepository = module.get<Repository<TokenEntity>>(
			getRepositoryToken(TokenEntity),
		);

		jest.clearAllMocks();
	});

	describe('generateToken', () => {
		it('should generate a token successfully', async () => {
			const options = {
				user_id: 1,
				type: TokenTypes.CHANGE_EMAIL,
				expiresInHours: 24,
				metadata: { ip: '127.0.0.1' },
			};

			mockTokenRepository.save.mockResolvedValue(mockToken);

			const result = await tokensService.generateToken(options);

			expect(tokenRepository.save).toHaveBeenCalledWith({
				user_id: options.user_id,
				metadata: options.metadata,
				expires_at: expect.any(Date),
				type: options.type,
				token_hash: expect.any(String),
				used_at: null,
			});
			expect(result.token).toBeDefined();
			expect(result.expires).toBeDefined();
		});
	});

	describe('validate', () => {
		it('should validate token successfully with correct tenant', async () => {
			const validateParams = {
				user_id: 1,
				type: TokenTypes.CHANGE_EMAIL,
				token: 'valid-token',
				tenantId: 1,
			};

			mockTokenRepository.findOne.mockResolvedValue(mockToken);

			const result = await tokensService.validate(validateParams);

			expect(tokenRepository.findOne).toHaveBeenCalledWith({
				where: {
					user_id: validateParams.user_id,
					type: validateParams.type,
					token_hash: expect.any(String),
				},
				relations: ['user'],
			});
			expect(result).toEqual(mockToken);
		});

		it('should throw BadRequestException when token not found', async () => {
			const validateParams = {
				user_id: 1,
				type: TokenTypes.CHANGE_EMAIL,
				token: 'invalid-token',
				tenantId: 1,
			};

			mockTokenRepository.findOne.mockResolvedValue(null);

			await expect(tokensService.validate(validateParams)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when token expired', async () => {
			const validateParams = {
				user_id: 1,
				type: TokenTypes.CHANGE_EMAIL,
				token: 'expired-token',
				tenantId: 1,
			};

			mockTokenRepository.findOne.mockResolvedValue(expiredToken);

			await expect(tokensService.validate(validateParams)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when tenant does not match', async () => {
			const validateParams = {
				user_id: 1,
				type: TokenTypes.CHANGE_EMAIL,
				token: 'valid-token',
				tenantId: 2, // Different tenant
			};

			mockTokenRepository.findOne.mockResolvedValue(mockToken);

			await expect(tokensService.validate(validateParams)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('validateToken', () => {
		it('should validate token successfully with correct tenant', async () => {
			const token = 'valid-token';
			const tenantId = 1;

			mockTokenRepository.findOne.mockResolvedValue(mockToken);

			const result = await tokensService.validateToken(token, tenantId);

			expect(tokenRepository.findOne).toHaveBeenCalledWith({
				where: { token_hash: expect.any(String) },
				relations: ['user'],
			});
			expect(result).toEqual(mockToken);
		});

		it('should throw BadRequestException when token not found', async () => {
			const token = 'invalid-token';
			const tenantId = 1;

			mockTokenRepository.findOne.mockResolvedValue(null);

			await expect(tokensService.validateToken(token, tenantId)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when token expired', async () => {
			const token = 'expired-token';
			const tenantId = 1;

			mockTokenRepository.findOne.mockResolvedValue(expiredToken);

			await expect(tokensService.validateToken(token, tenantId)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when token already used', async () => {
			const token = 'used-token';
			const tenantId = 1;

			mockTokenRepository.findOne.mockResolvedValue(usedToken);

			await expect(tokensService.validateToken(token, tenantId)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when tenant does not match', async () => {
			const token = 'valid-token';
			const tenantId = 2; // Different tenant

			mockTokenRepository.findOne.mockResolvedValue(mockToken);

			await expect(tokensService.validateToken(token, tenantId)).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('markAsUsed', () => {
		it('should mark token as used successfully without tenant validation', async () => {
			const tokenId = 'token-uuid-123';
			const updateResult = { affected: 1, generatedMaps: [], raw: [] };

			mockTokenRepository.update.mockResolvedValue(updateResult);

			const result = await tokensService.markAsUsed(tokenId);

			expect(tokenRepository.update).toHaveBeenCalledWith(tokenId, {
				used_at: expect.any(Date),
			});
			expect(result).toEqual(updateResult);
		});

		it('should mark token as used successfully with matching tenant', async () => {
			const tokenId = 'token-uuid-123';
			const tenantId = 1;
			const updateResult = { affected: 1, generatedMaps: [], raw: [] };

			mockTokenRepository.findOne.mockResolvedValue(mockToken);
			mockTokenRepository.update.mockResolvedValue(updateResult);

			const result = await tokensService.markAsUsed(tokenId, tenantId);

			expect(tokenRepository.findOne).toHaveBeenCalledWith({
				where: { id: tokenId },
				relations: ['user'],
			});
			expect(tokenRepository.update).toHaveBeenCalledWith(tokenId, {
				used_at: expect.any(Date),
			});
			expect(result).toEqual(updateResult);
		});

		it('should throw BadRequestException when tenant does not match', async () => {
			const tokenId = 'token-uuid-123';
			const tenantId = 2; // Different tenant

			mockTokenRepository.findOne.mockResolvedValue(mockToken);

			await expect(tokensService.markAsUsed(tokenId, tenantId)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should proceed when token not found but no tenant validation', async () => {
			const tokenId = 'non-existent-token';
			const updateResult = { affected: 0, generatedMaps: [], raw: [] };

			mockTokenRepository.update.mockResolvedValue(updateResult);

			const result = await tokensService.markAsUsed(tokenId);

			expect(tokenRepository.update).toHaveBeenCalledWith(tokenId, {
				used_at: expect.any(Date),
			});
			expect(result).toEqual(updateResult);
		});
	});

	describe('cleanupExpiredTokens', () => {
		it('should cleanup expired tokens for tenant', async () => {
			const tenantId = 1;
			const deleteResult = { affected: 5, raw: [] };

			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				delete: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue(deleteResult),
			};

			mockTokenRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await tokensService.cleanupExpiredTokens(tenantId);

			expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('token');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
				'token.user',
				'user',
			);
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'user.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'token.expires_at < :now',
				{ now: expect.any(Date) },
			);
			expect(mockQueryBuilder.delete).toHaveBeenCalled();
			expect(result).toBe(5);
		});

		it('should return 0 when no tokens to cleanup', async () => {
			const tenantId = 1;
			const deleteResult = { affected: 0, raw: [] };

			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				delete: jest.fn().mockReturnThis(),
				execute: jest.fn().mockResolvedValue(deleteResult),
			};

			mockTokenRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await tokensService.cleanupExpiredTokens(tenantId);

			expect(result).toBe(0);
		});
	});

	describe('countTokensByTenant', () => {
		it('should count tokens for tenant', async () => {
			const tenantId = 1;

			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				getCount: jest.fn().mockResolvedValue(10),
			};

			mockTokenRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await tokensService.countTokensByTenant(tenantId);

			expect(mockTokenRepository.createQueryBuilder).toHaveBeenCalledWith('token');
			expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
				'token.user',
				'user',
			);
			expect(mockQueryBuilder.where).toHaveBeenCalledWith(
				'user.tenant_id = :tenantId',
				{ tenantId },
			);
			expect(result).toBe(10);
		});

		it('should return 0 when no tokens for tenant', async () => {
			const tenantId = 2;

			const mockQueryBuilder = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				getCount: jest.fn().mockResolvedValue(0),
			};

			mockTokenRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await tokensService.countTokensByTenant(tenantId);

			expect(result).toBe(0);
		});
	});
});
