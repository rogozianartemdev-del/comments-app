import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVotes1790812800002 implements MigrationInterface {
  name = 'CreateVotes1790812800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE votes (
        id         CHAR(36)    NOT NULL,
        user_id    CHAR(36)    NOT NULL,
        comment_id CHAR(36)    NOT NULL,
        vote_type  ENUM('like','dislike') NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE KEY uq_votes_user_comment (user_id, comment_id),
        KEY idx_votes_comment (comment_id),
        CONSTRAINT fk_votes_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        CONSTRAINT fk_votes_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE votes');
  }
}