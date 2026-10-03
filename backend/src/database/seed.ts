import 'dotenv/config';
import { randomUUID } from 'crypto';
import { hash } from 'bcrypt';
import dataSource from './data-source';

async function seed() {
  await dataSource.initialize();

  const passwordHash = await hash('password123', 10);

  const userId = randomUUID();
  await dataSource.query(
    `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
    [userId, 'demo_user', 'demo@example.com', passwordHash],
  );

  const rootId = randomUUID();
  await dataSource.query(
    `INSERT INTO comments (id, user_id, parent_id, username, email, home_page, text, ip_address, depth)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 0)`,
    [rootId, userId, 'demo_user', 'demo@example.com', 'https://example.com', 'Первый тестовый комментарий', '127.0.0.1'],
  );

  const replyId = randomUUID();
  await dataSource.query(
    `INSERT INTO comments (id, user_id, parent_id, username, email, home_page, text, ip_address, depth)
     VALUES (?, NULL, ?, ?, ?, NULL, ?, ?, 1)`,
    [replyId, rootId, 'Anonym', 'anon@example.com', 'Это ответ на первый комментарий', '127.0.0.2'],
  );

  console.log('Seed completed:', { userId, rootId, replyId });
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});