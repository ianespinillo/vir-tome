import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestFieldsToLoan1767915259878 implements MigrationInterface {
	name = 'AddGuestFieldsToLoan1767915259878';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "multitenant" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tenant_id" integer NOT NULL, CONSTRAINT "PK_8af996f5dec8b121a36498ea502" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_c0a4df5b433e69fd4a038627d6" ON "multitenant" ("tenant_id") `,
		);
		await queryRunner.query(
			`ALTER TABLE "multitenant" ADD CONSTRAINT "FK_c0a4df5b433e69fd4a038627d6b" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "multitenant" DROP CONSTRAINT "FK_c0a4df5b433e69fd4a038627d6b"`,
		);
		await queryRunner.query(
			`DROP INDEX "public"."IDX_c0a4df5b433e69fd4a038627d6"`,
		);
		await queryRunner.query(`DROP TABLE "multitenant"`);
	}
}
