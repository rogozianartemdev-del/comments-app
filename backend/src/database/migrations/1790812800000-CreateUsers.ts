import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1790812800000 implements MigrationInterface {
  name = 'CreateUsers1790812800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id            CHAR(36)     NOT NULL,
        username      VARCHAR(50)  NOT NULL,
        email         VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_username (username),
        UNIQUE KEY uq_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE users');
  }
}