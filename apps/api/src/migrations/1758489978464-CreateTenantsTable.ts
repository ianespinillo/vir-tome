import {
	Index,
	MigrationInterface,
	QueryRunner,
	Table,
	TableIndex,
} from 'typeorm';

export class CreateTenantsTable1758489978464 implements MigrationInterface {
	name = 'CreateTenantsTable1758489978464';
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.createTable(
			new Table({
				name: 'tenant',
				columns: [
					{
						name: 'id',
						type: 'int',
						isPrimary: true,
						isGenerated: true,
						generationStrategy: 'increment',
					},
					{
						name: 'subdomain',
						type: 'varchar',
						length: '50',
						isUnique: true,
						isNullable: false,
					},
					{
						name: 'name',
						type: 'varchar',
						length: '255',
						isNullable: false,
					},
					{
						name: 'contact_email',
						type: 'varchar',
						length: '255',
						isNullable: false,
					},
					{
						name: 'is_active',
						type: 'boolean',
						default: true,
					},
					{
						name: 'is_demo',
						type: 'boolean',
						default: false,
					},
					{
						name: 'settings',
						type: 'jsonb',
						isNullable: true,
					},
					{
						name: 'plan',
						type: 'varchar',
						length: '100',
						isNullable: true,
					},
					{
						name: 'subscription_expires_at',
						type: 'timestamp with time zone',
						isNullable: true,
					},
					{
						name: 'created_at',
						type: 'timestamp with time zone',
						default: 'CURRENT_TIMESTAMP',
					},
					{
						name: 'updated_at',
						type: 'timestamp with time zone',
						default: 'CURRENT_TIMESTAMP',
						onUpdate: 'CURRENT_TIMESTAMP',
					},
					{
						name: 'deleted_at',
						type: 'timestamp with time zone',
						isNullable: true,
					},
				],
			}),
			true,
		);

		// Crear índices
		await queryRunner.createIndex(
			'tenant',
			new TableIndex({
				name: 'IDX_TENANT_SUBDOMAIN',
				columnNames: ['subdomain'],
				isUnique: true,
			}),
		);

		await queryRunner.createIndex(
			'tenant',
			new TableIndex({
				name: 'IDX_TENANT_CONTACT_EMAIL',
				columnNames: ['contact_email'],
			}),
		);

		await queryRunner.createIndex(
			'tenant',
			new TableIndex({
				name: 'IDX_TENANT_ACTIVE',
				columnNames: ['is_active'],
			}),
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropIndex('tenant', 'IDX_TENANT_ACTIVE');
		await queryRunner.dropIndex('tenant', 'IDX_TENANT_CONTACT_EMAIL');
		await queryRunner.dropIndex('tenant', 'IDX_TENANT_SUBDOMAIN');
		await queryRunner.dropTable('tenant');
	}
}
