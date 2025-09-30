import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class UpdateUserRoleIndexes1759190921171 implements MigrationInterface {
	name = 'UpdateUserRoleIndexes1759190921171';
	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Eliminar índice de email único global (si existe)
		try {
			await queryRunner.dropIndex('user', 'IDX_USER_EMAIL');
		} catch {
			// Ignorar si no existe
		}

		// 2. Crear índice único compuesto (tenant_id, email)
		await queryRunner.createIndex(
			'user',
			new TableIndex({
				name: 'IDX_USER_TENANT_EMAIL',
				columnNames: ['tenant_id', 'email'],
				isUnique: true,
			}),
		);

		// 3. Eliminar índice de name único global en roles (si existe)
		try {
			await queryRunner.dropIndex('role', 'IDX_ROLE_NAME');
		} catch {
			// Ignorar si no existe
		}

		// 4. Crear índice único compuesto (tenant_id, name)
		await queryRunner.createIndex(
			'role',
			new TableIndex({
				name: 'IDX_ROLE_TENANT_NAME',
				columnNames: ['tenant_id', 'name'],
				isUnique: true,
			}),
		);

		console.log('✅ Índices multi-tenant actualizados');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropIndex('user', 'IDX_USER_TENANT_EMAIL');
		await queryRunner.dropIndex('role', 'IDX_ROLE_TENANT_NAME');
	}
}
