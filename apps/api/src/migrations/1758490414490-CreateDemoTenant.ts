import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDemoTenant1758490414490 implements MigrationInterface {
	name = 'CreateDemoTenant1758490414490';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Crear tenant demo
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
        'demo',
        'Escuela Primaria Demo',
        'demo@tuapp.com',
        true,
        true,
        '{
          "theme": "blue",
          "features": ["basic_library", "advanced_reports"],
          "school_info": {
            "name": "Escuela Primaria Demo",
            "address": "Calle Falsa 123, Demo City",
            "phone": "+54 11 1234-5678",
            "principal": "Prof. Demo Admin"
          },
          "limits": {
            "max_books": 500,
            "max_users": 100,
            "max_loans": 200
          }
        }',
        'premium',
        CURRENT_TIMESTAMP
      ) ON CONFLICT (subdomain) DO NOTHING;
    `);

		console.log('🎭 Tenant demo creado exitosamente');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      DELETE FROM tenant WHERE subdomain = 'demo';
    `);

		console.log('🗑️ Tenant demo eliminado');
	}
}
