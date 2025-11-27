import { ForbiddenException, NotFoundException } from '@nestjs/common';
// test/multi-tenant.service.spec.ts
import { Repository } from 'typeorm';
import { MultiTenantEntity } from './multi-tenant.entity';
import { MultiTenantService } from './multi-tenant.service';

class TestEntity extends MultiTenantEntity {
	name!: string;
}

class TestTenantService extends MultiTenantService<TestEntity> {}

describe('MultiTenantService', () => {
	let service: TestTenantService;
	let repo: jest.Mocked<Repository<TestEntity>>;

	const tenantId = 1;

	beforeEach(() => {
		repo = {
			find: jest.fn(),
			findOne: jest.fn(),
			findAndCount: jest.fn(),
			save: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			count: jest.fn(),
		} as any;

		service = new TestTenantService(repo);
	});

	// ===========================
	// FIND METHODS
	// ===========================

	it('findAll should filter by tenant', async () => {
		const entities = [{ id: 1, tenant_id: tenantId }] as TestEntity[];
		repo.find.mockResolvedValue(entities);

		const result = await service.findAll(tenantId);
		expect(result).toEqual(entities);
		expect(repo.find).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ tenant_id: tenantId }),
			}),
		);
	});

	it('findById should return entity or null', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		repo.findOne.mockResolvedValue(entity);

		const result = await service.findById(tenantId, 1);
		expect(result).toEqual(entity);
	});

	it('findByIdOrFail should throw if not found', async () => {
		repo.findOne.mockResolvedValue(null);
		await expect(service.findByIdOrFail(tenantId, 1)).rejects.toThrow(
			NotFoundException,
		);
	});

	it('findBy should filter correctly', async () => {
		repo.find.mockResolvedValue([{ id: 1, tenant_id: tenantId }] as TestEntity[]);
		const result = await service.findBy(tenantId, { name: 'Test' } as any);
		expect(result).toHaveLength(1);
	});

	it('findOne should work', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		repo.findOne.mockResolvedValue(entity);

		const result = await service.findOne(tenantId, { id: 1 } as any);
		expect(result).toEqual(entity);
	});

	it('findByPage should return paginated result', async () => {
		repo.findAndCount.mockResolvedValue([
			[{ id: 1, tenant_id: tenantId } as TestEntity],
			1,
		]);
		const result = await service.findByPage(tenantId, 1, 10);
		expect(result.total).toBe(1);
		expect(result.data).toHaveLength(1);
	});

	it('findByName should search with ILike', async () => {
		repo.find.mockResolvedValue([
			{ id: 1, name: 'Test', tenant_id: tenantId },
		] as TestEntity[]);
		const result = await service.findByName(tenantId, 'Test');
		expect(result[0].name).toBe('Test');
	});

	it('findByField should search by dynamic field', async () => {
		repo.find.mockResolvedValue([
			{ id: 1, name: 'Field', tenant_id: tenantId },
		] as TestEntity[]);
		const result = await service.findByField(tenantId, 'name', 'Field');
		expect(result[0].name).toBe('Field');
	});

	it('searchByFields should search multiple fields', async () => {
		repo.find.mockResolvedValue([
			{ id: 1, name: 'Search', tenant_id: tenantId },
		] as TestEntity[]);
		const result = await service.searchByFields(tenantId, 'Search', ['name']);
		expect(result).toHaveLength(1);
	});

	// ===========================
	// CREATE / UPDATE / DELETE
	// ===========================

	it('create should attach tenant_id', async () => {
		const data = { name: 'New' };
		const entity = { id: 1, name: 'New', tenant_id: tenantId } as TestEntity;

		repo.create.mockReturnValue(entity);
		repo.save.mockResolvedValue(entity);

		const result = await service.create(tenantId, data);
		expect(result.tenant_id).toBe(tenantId);
	});

	it('update should sanitize tenant_id', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		jest.spyOn(service, 'findByIdOrFail').mockResolvedValue(entity);

		repo.update.mockResolvedValue({} as any);
		repo.findOne.mockResolvedValue(entity);

		await service.update(tenantId, 1, { tenant_id: 999, name: 'Updated' } as any);

		expect(repo.update).toHaveBeenCalledWith(
			1,
			expect.not.objectContaining({ tenant_id: 999 }),
		);
	});

	it('delete should soft delete entity', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		jest.spyOn(service, 'findByIdOrFail').mockResolvedValue(entity);

		await service.delete(tenantId, 1);
		expect(repo.update).toHaveBeenCalledWith(
			{ id: 1, tenant_id: tenantId },
			expect.objectContaining({ deleted_at: expect.any(Date) }),
		);
	});

	it('hardDelete should call repository.delete with tenantId', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		jest.spyOn(service, 'findByIdOrFail').mockResolvedValue(entity);

		await service.hardDelete(tenantId, 1);
		expect(repo.delete).toHaveBeenCalledWith({
			id: 1,
			tenant_id: tenantId,
		});
	});

	// ===========================
	// COUNT & EXISTS
	// ===========================

	it('count should return number', async () => {
		repo.count.mockResolvedValue(5);
		const result = await service.count(tenantId);
		expect(result).toBe(5);
	});

	it('exists should return true if count > 0', async () => {
		repo.count.mockResolvedValue(1);
		const result = await service.exists(tenantId, { id: 1 } as any);
		expect(result).toBe(true);
	});

	it('findAndCount should return tuple', async () => {
		const entity = { id: 1, tenant_id: tenantId } as TestEntity;
		repo.findAndCount.mockResolvedValue([[entity], 1]);
		const result = await service.findAndCount(tenantId);
		expect(result[1]).toBe(1);
	});

	// ===========================
	// BATCH
	// ===========================

	it('createMany should attach tenant_id to all', async () => {
		const entities = [
			{ name: 'a', tenant_id: tenantId },
			{ name: 'b', tenant_id: tenantId },
		] as any;
		repo.create.mockReturnValue(entities);
		repo.save.mockResolvedValue(entities);

		const result = await service.createMany(tenantId, [
			{ name: 'a' },
			{ name: 'b' },
		]);
		expect(result).toHaveLength(2);
		expect(result[0].tenant_id).toBe(tenantId);
	});

	it('deleteMany should throw if some entities not found', async () => {
		repo.find.mockResolvedValue([{ id: 1, tenant_id: tenantId }] as any);

		await expect(service.deleteMany(tenantId, [1, 2])).rejects.toThrow(
			NotFoundException,
		);
	});

	// ===========================
	// STATS
	// ===========================

	it('getStats should return totals', async () => {
		repo.count
			.mockResolvedValueOnce(10) // total
			.mockResolvedValueOnce(8); // active

		const result = await service.getStats(tenantId);
		expect(result).toEqual({ total: 10, active: 8, deleted: 2 });
	});
});
