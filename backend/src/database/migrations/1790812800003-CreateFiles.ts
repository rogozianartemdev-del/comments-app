import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1790812800003 implements MigrationInterface {
  name = 'CreateFiles1790812800003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE files (
        id            CHAR(36)     NOT NULL,
        comment_id    CHAR(36)     NOT NULL,
        type          ENUM('image','txt') NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        stored_name   VARCHAR(255) NOT NULL,
        mime_type     VARCHAR(100) NOT NULL,
        size_bytes    INT UNSIGNED NOT NULL,
        status        ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
        created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_files_stored_name (stored_name),
        KEY idx_files_comment (comment_id),
        CONSTRAINT fk_files_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE files');
  }
}