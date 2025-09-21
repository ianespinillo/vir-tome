// scripts/migration-helpers.ts
import { DataSource } from 'typeorm';

export class MigrationHelper {
	static async verifyDataIntegrity(dataSource: DataSource): Promise<boolean> {
		const queryRunner = dataSource.createQueryRunner();

		try {
			console.log('🔍 Verificando integridad de datos...');

			// Verificar que no hay registros sin tenant_id
			const tables = ['user', 'role', 'book', 'category', 'publisher', 'loan'];

			for (const table of tables) {
				const result = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM "${table}" 
          WHERE tenant_id IS NULL AND deleted_at IS NULL;
        `);

				const nullCount = Number.parseInt(result[0].count);
				if (nullCount > 0) {
					console.log(
						`❌ Tabla ${table} tiene ${nullCount} registros sin tenant_id`,
					);
					return false;
				}
			}

			// Verificar que todos los tenant_id son válidos
			for (const table of tables) {
				const result = await queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM "${table}" t1 
          LEFT JOIN tenant t2 ON t1.tenant_id = t2.id
          WHERE t1.deleted_at IS NULL 
            AND t1.tenant_id IS NOT NULL 
            AND t2.id IS NULL;
        `);

				const orphanCount = Number.parseInt(result[0].count);
				if (orphanCount > 0) {
					console.log(
						`❌ Tabla ${table} tiene ${orphanCount} registros con tenant_id inválido`,
					);
					return false;
				}
			}

			console.log('✅ Integridad de datos verificada correctamente');
			return true;
		} finally {
			await queryRunner.release();
		}
	}

	static async backupBeforeMigration(dataSource: DataSource): Promise<void> {
		const queryRunner = dataSource.createQueryRunner();

		try {
			console.log('📦 Creando backup de seguridad...');

			// Crear tabla de backup con timestamp
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupTable = `migration_backup_${timestamp}`;

			const tables = ['user', 'role', 'book', 'category', 'publisher', 'loan'];

			for (const table of tables) {
				await queryRunner.query(`
          CREATE TABLE "${backupTable}_${table}" AS 
          SELECT * FROM "${table}";
        `);

				console.log(`📋 Backup creado: ${backupTable}_${table}`);
			}

			console.log('✅ Backup completado');
		} finally {
			await queryRunner.release();
		}
	}

	static async getTableStats(dataSource: DataSource): Promise<void> {
		const queryRunner = dataSource.createQueryRunner();

		try {
			console.log('📊 Estadísticas de tablas:');

			const tables = [
				'tenant',
				'user',
				'role',
				'book',
				'category',
				'publisher',
				'loan',
			];

			for (const table of tables) {
				const total = await queryRunner.query(`
          SELECT COUNT(*) as count FROM "${table}";
        `);

				const active = await queryRunner.query(`
          SELECT COUNT(*) as count FROM "${table}" WHERE deleted_at IS NULL;
        `);

				console.log(
					`📋 ${table}: ${active[0].count} activos / ${total[0].count} total`,
				);
			}
		} finally {
			await queryRunner.release();
		}
	}
}
