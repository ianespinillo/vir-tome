import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateDefaultTenant1758490393815 implements MigrationInterface {
	name = 'PopulateDefaultTenant1758490393815';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Crear tenant por defecto para datos existentes
		await queryRunner.query(`
      INSERT INTO tenant (
        subdomain, 
        name, 
        contact_email, 
        is_active, 
        is_demo,
        settings,
        plan,
        created_at
      ) VALUES (
        'default',
        'Sistema Actual',
        'admin@sistema.com',
        true,
        false,
        '{"theme": "light", "features": ["basic_library"], "limits": {"max_books": 10000, "max_users": 1000, "max_loans": 5000}}',
        'enterprise',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (subdomain) DO NOTHING;
    `);

		// 2. Obtener el ID del tenant por defecto
		const defaultTenantResult = await queryRunner.query(`
      SELECT id FROM tenant WHERE subdomain = 'default' LIMIT 1;
    `);

		if (defaultTenantResult.length === 0) {
			throw new Error('No se pudo crear el tenant por defecto');
		}

		const defaultTenantId = defaultTenantResult[0].id;
		console.log(`📝 Tenant por defecto creado con ID: ${defaultTenantId}`);

		// 3. Actualizar todas las tablas con el tenant_id por defecto
		const tables = ['user', 'role', 'book', 'category', 'publisher'];

		for (const tableName of tables) {
			// Verificar si la tabla tiene datos
			const countResult = await queryRunner.query(`
        SELECT COUNT(*) as count FROM "${tableName}" WHERE deleted_at IS NULL;
      `);

			const recordCount = Number.parseInt(countResult[0].count);

			if (recordCount > 0) {
				// Actualizar registros existentes
				await queryRunner.query(
					`
          UPDATE "${tableName}" 
          SET tenant_id = $1 
          WHERE tenant_id IS NULL AND deleted_at IS NULL;
        `,
					[defaultTenantId],
				);

				console.log(
					`📊 ${recordCount} registros actualizados en tabla ${tableName}`,
				);
			}
		}

		console.log('✅ Todos los datos existentes asignados al tenant por defecto');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Rollback: remover tenant_id de todas las tablas
		const tables = ['user', 'role', 'book', 'category', 'publisher', 'loan'];

		for (const tableName of tables) {
			await queryRunner.query(`
        UPDATE "${tableName}" SET tenant_id = NULL;
      `);
		}

		// Eliminar tenant por defecto
		await queryRunner.query(`
      DELETE FROM tenant WHERE subdomain = 'default';
    `);

		console.log('🔄 Rollback completado - datos sin tenant_id');
	}
}
