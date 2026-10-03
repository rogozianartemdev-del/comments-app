import 'dotenv/config';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import dataSource from './data-source';

const ROOT_COUNT = 100;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261003);
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

const NAMES = [
  'Anna', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
  'Mallory', 'Oscar', 'Peggy', 'Rum8', 'Sybil', 'Trent', 'Victor', 'Walter', 'Zoe', 'Anonym',
];

const TEXTS = [
  'Каждый из нас понимает очевидную вещь: семантический разбор внешних противодействий предоставляет широкие возможности.',
  'Безусловно, постоянное <strong>информационно-пропагандистское</strong> обеспечение нашей деятельности предопределяет высокую востребованность позиций.',
  'Внезапно, тщательные исследования конкурентов будут <i>ассоциативно</i> распределены по отраслям.',
  'Идейные соображения высшего порядка, а также понимание сути ресурсосберегающих технологий играет определяющее значение.',
  'Предварительные выводы неутешительны: убеждённость некоторых оппонентов, а также <code>const x = 42;</code> требует анализа.',
  'Подробности смотрите здесь: <a href="https://example.com" title="Пример">example.com</a>.',
  'А ещё интерактивные прототипы являются только методом политического участия.',
  'Согласен с предыдущим комментарием, добавлю только одно: <strong>проверяйте источники</strong>.',
  'Интересная мысль, но <i>как это масштабируется</i> на большие объёмы данных?',
  'Спасибо за ответ! Это именно то, что я искал.',
];

const AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
];

interface Row {
  id: string;
  userId: string | null;
  parentId: string | null;
  username: string;
  email: string;
  homePage: string | null;
  text: string;
  ip: string;
  userAgent: string;
  depth: number;
  createdAt: Date;
}

const NOW = Date.now();
const rootTime = (i: number) => new Date(NOW - (ROOT_COUNT - i) * 90 * 60 * 1000);
const replyTime = (parent: Row) =>
  new Date(Math.min(parent.createdAt.getTime() + int(5, 120) * 60 * 1000, NOW - 60 * 1000));

function makeRow(parent: Row | null, createdAt: Date, demoUserId: string | null): Row {
  const name = demoUserId ? 'demo_user' : pick(NAMES);
  return {
    id: randomUUID(),
    userId: demoUserId,
    parentId: parent?.id ?? null,
    username: name,
    email: demoUserId ? 'demo@example.com' : `${name.toLowerCase()}@example.com`,
    homePage: !demoUserId && rand() < 0.2 ? `https://${name.toLowerCase()}.example.com` : null,
    text: pick(TEXTS),
    ip: `192.168.${int(0, 255)}.${int(1, 254)}`,
    userAgent: pick(AGENTS),
    depth: parent ? parent.depth + 1 : 0,
    createdAt,
  };
}

const INSERT_COMMENT = `
  INSERT INTO comments
    (id, user_id, parent_id, username, email, home_page, \`text\`, ip_address, user_agent, depth, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

async function seed() {
  await dataSource.initialize();

 

  const runner = dataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();

  try {
    const demoId = randomUUID();
    await runner.query(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [demoId, 'demo_user', 'demo@example.com', await hash('password123', 10)],
    );

    const insert = (r: Row) =>
      runner.query(INSERT_COMMENT, [
        r.id, r.userId, r.parentId, r.username, r.email, r.homePage,
        r.text, r.ip, r.userAgent, r.depth, r.createdAt,
      ]);

    const roots: Row[] = [];
    let repliesTotal = 0;

    for (let i = 0; i < ROOT_COUNT; i++) {
      const root = makeRow(null, rootTime(i), i % 10 === 0 ? demoId : null);
      await insert(root);
      roots.push(root);

      let mode: 'flat' | 'chain' | 'mixed' = 'mixed';
      let n = int(0, 4);
      if (i % 25 === 0) {
        mode = 'flat';
        n = 30;
      } else if (i % 20 === 5) {
        mode = 'chain'; 
        n = 8;
      }

      const thread: Row[] = [root];
      for (let k = 0; k < n; k++) {
        const parent =
          mode === 'flat' ? root : mode === 'chain' ? thread[thread.length - 1] : pick(thread);
        const reply = makeRow(parent, replyTime(parent), null);
        await insert(reply);
        thread.push(reply);
        repliesTotal++;
      }
    }

    const voted = new Set<string>();
    while (voted.size < 10) voted.add(pick(roots).id);
    for (const commentId of voted) {
      const like = rand() < 0.7;
      await runner.query(
        'INSERT INTO votes (id, user_id, comment_id, vote_type) VALUES (?, ?, ?, ?)',
        [randomUUID(), demoId, commentId, like ? 'like' : 'dislike'],
      );
      await runner.query('UPDATE comments SET score = score + ? WHERE id = ?', [like ? 1 : -1, commentId]);
    }

    await runner.commitTransaction();
    console.log(`Готово: ${ROOT_COUNT} корневых комментариев, ${repliesTotal} ответов, 10 голосов.`);
    console.log('Тестовый вход: demo_user / password123');
  } catch (err) {
    await runner.rollbackTransaction();
    throw err;
  } finally {
    await runner.release();
    await dataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});