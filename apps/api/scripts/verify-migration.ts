// scripts/verify-migration.ts
import { DataSource } from 'typeorm';
import dataSource from '../src/core/typeorm-config'; // Ajustar path según tu config
import { MigrationHelper } from './migrations-helper';

async function verifyMigration() {
	try {
		await dataSource.initialize();
		console.log('🔗 Conexión a BD establecida');

		// Verificar integridad
		const isValid = await MigrationHelper.verifyDataIntegrity(dataSource);

		if (!isValid) {
			console.log('❌ Migración tiene errores de integridad');
			process.exit(1);
		}

		// Mostrar estadísticas
		await MigrationHelper.getTableStats(dataSource);

		console.log('✅ Migración verificada exitosamente');
	} catch (error) {
		console.error('❌ Error verificando migración:', error);
		process.exit(1);
	} finally {
		await dataSource.destroy();
	}
}

// Ejecutar si es llamado directamente
if (require.main === module) {
	verifyMigration();
}
