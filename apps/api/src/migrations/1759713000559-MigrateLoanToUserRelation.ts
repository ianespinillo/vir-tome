import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateLoanToUserRelation1759713000559
	implements MigrationInterface
{
	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Agregar columna user_id (nullable temporalmente)
		await queryRunner.query(`
      ALTER TABLE "loan" 
      ADD COLUMN "user_id" INTEGER
    `);

		// 2. Migrar datos existentes (opcional, si tienes datos)
		// Esto intentará encontrar users por borrowerName
		// Si no tienes datos, puedes saltarlo
		await queryRunner.query(`
      UPDATE "loan" l
      SET "user_id" = (
        SELECT u.id 
        FROM "users" u 
        WHERE CONCAT(u.name, ' ', u.surname) = l."borrowerName"
        LIMIT 1
      )
      WHERE l."borrowerName" IS NOT NULL
    `);

		// 3. Hacer user_id NOT NULL después de migrar
		await queryRunner.query(`
      ALTER TABLE "loan" 
      ALTER COLUMN "user_id" SET NOT NULL
    `);

		// 4. Agregar foreign key
		await queryRunner.query(`
      ALTER TABLE "loan" 
      ADD CONSTRAINT "FK_loan_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE RESTRICT
    `);

		// 5. Eliminar columna borrowerName
		await queryRunner.query(`
      ALTER TABLE "loan" 
      DROP COLUMN "borrowerName"
    `);

		// 6. Renombrar columnas snake_case (opcional pero recomendado)
		await queryRunner.query(`
      ALTER TABLE "loan" 
      RENAME COLUMN "loanDate" TO "loan_date"
    `);

		await queryRunner.query(`
      ALTER TABLE "loan" 
      RENAME COLUMN "returnDate" TO "return_date"
    `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// Rollback
		await queryRunner.query(`
      ALTER TABLE "loan" 
      RENAME COLUMN "loan_date" TO "loanDate"
    `);

		await queryRunner.query(`
      ALTER TABLE "loan" 
      RENAME COLUMN "return_date" TO "returnDate"
    `);

		await queryRunner.query(`
      ALTER TABLE "loan" 
      ADD COLUMN "borrowerName" VARCHAR(255)
    `);

		await queryRunner.query(`
      UPDATE "loan" l
      SET "borrowerName" = (
        SELECT CONCAT(u.name, ' ', u.surname)
        FROM "users" u 
        WHERE u.id = l."user_id"
      )
    `);

		await queryRunner.query(`
      ALTER TABLE "loan" 
      DROP CONSTRAINT "FK_loan_user"
    `);

		await queryRunner.query(`
      ALTER TABLE "loan" 
      DROP COLUMN "user_id"
    `);
	}
}
