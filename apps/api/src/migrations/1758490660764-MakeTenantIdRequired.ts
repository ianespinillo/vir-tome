import {
	MigrationInterface,
	QueryRunner,
	TableColumn,
	TableForeignKey,
} from 'typeorm';

export class MakeTenantIdRequired1758490660764 implements MigrationInterface {
	name = 'MakeTenantIdRequired1758490660764';
	private readonly tables = [
		'user',
		'role',
		'book',
		'category',
		'publisher',
		'loan',
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Verificar que no hay registros sin tenant_id
		for (const tableName of this.tables) {
			const nullRecords = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM "${tableName}" 
        WHERE tenant_id IS NULL AND deleted_at IS NULL;
      `);

			if (Number.parseInt(nullRecords[0].count) > 0) {
				throw new Error(
					`❌ Tabla ${tableName} tiene registros sin tenant_id. Ejecutar migración anterior primero.`,
				);
			}
		}

		// 2. Hacer tenant_id NOT NULL y agregar foreign keys
		for (const tableName of this.tables) {
			// Alterar columna para ser NOT NULL
			await queryRunner.changeColumn(
				tableName,
				'tenant_id',
				new TableColumn({
					name: 'tenant_id',
					type: 'int',
					isNullable: false, // Ahora requerido
				}),
			);

			// Agregar foreign key constraint
			await queryRunner.createForeignKey(
				tableName,
				new TableForeignKey({
					name: `FK_${tableName}_tenant_id`,
					columnNames: ['tenant_id'],
					referencedTableName: 'tenant',
					referencedColumnNames: ['id'],
					onDelete: 'RESTRICT', // No permitir eliminar tenant si tiene datos
					onUpdate: 'CASCADE',
				}),
			);

			console.log(`✅ Tabla ${tableName} - tenant_id es ahora requerido con FK`);
		}

		console.log('🎯 Todas las tablas ahora requieren tenant_id válido');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Remover foreign keys y hacer tenant_id nullable again
		for (const tableName of this.tables) {
			await queryRunner.dropForeignKey(tableName, `FK_${tableName}_tenant_id`);

			await queryRunner.changeColumn(
				tableName,
				'tenant_id',
				new TableColumn({
					name: 'tenant_id',
					type: 'int',
					isNullable: true,
				}),
			);
		}

		console.log('🔄 Foreign keys removidas y tenant_id es nullable nuevamente');
	}
}
