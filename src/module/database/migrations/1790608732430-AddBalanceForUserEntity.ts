import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceForUserEntity1790608732430 implements MigrationInterface {
  name = 'AddBalanceForUserEntity1790608732430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD "status" "public"."transaction_status_enum" NOT NULL DEFAULT 'IN_PROGRESS'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "transaction"."status" IS 'Статус транзакции'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "transaction"."status" IS 'Статус транзакции'`,
    );
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."transaction_status_enum"`);
  }
}
