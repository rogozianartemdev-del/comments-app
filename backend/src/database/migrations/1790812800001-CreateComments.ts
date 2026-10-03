import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1790812800001 implements MigrationInterface {
  name = 'CreateComments1790812800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE comments (
        id         CHAR(36)     NOT NULL,
        user_id    CHAR(36)     NULL,
        parent_id  CHAR(36)     NULL,
        username   VARCHAR(50)  NOT NULL,
        email      VARCHAR(255) NOT NULL,
        home_page  VARCHAR(255) NULL,
        \`text\`   TEXT         NOT NULL,
        ip_address VARCHAR(45)  NOT NULL,
        user_agent VARCHAR(512) NULL,
        score      INT          NOT NULL DEFAULT 0,
        depth      INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_comments_parent_created (parent_id, created_at),
        KEY idx_comments_created (created_at),
        KEY idx_comments_username (username),
        KEY idx_comments_email (email),
        CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE SET NULL,
        CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE comments');
  }
}