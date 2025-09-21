import {
	MigrationInterface,
	QueryRunner,
	TableColumn,
	TableIndex,
} from 'typeorm';

export class AddTenantIdToAllTables1758490372612 implements MigrationInterface {
	name = 'AddTenantIdToAllTables1758490372612';
	private readonly tables = [
		'user',
		'role',
		'book',
		'category',
		'publisher',
		'loan',
		// tokens ya tiene user_id, se manejará diferente
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Agregar columna tenant_id a todas las tablas (nullable por ahora)
		for (const tableName of this.tables) {
			await queryRunner.addColumn(
				tableName,
				new TableColumn({
					name: 'tenant_id',
					type: 'int',
					isNullable: true, // Temporal, para poblar datos
				}),
			);

			// Crear índice para performance
			await queryRunner.createIndex(
				tableName,
				new TableIndex({
					name: `IDX_${tableName.toUpperCase()}_TENANT_ID`,
					columnNames: ['tenant_id'],
				}),
			);
		}

		console.log('✅ Columnas tenant_id agregadas a todas las tablas');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Remover en orden inverso
		for (const tableName of this.tables.reverse()) {
			await queryRunner.dropIndex(
				tableName,
				`IDX_${tableName.toUpperCase()}_TENANT_ID`,
			);
			await queryRunner.dropColumn(tableName, 'tenant_id');
		}
	}
}
