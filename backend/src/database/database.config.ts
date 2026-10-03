import { join } from 'path';
import { MysqlDataSourceOptions } from 'typeorm/driver/mysql/MysqlDataSourceOptions';

export interface DbEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
}

const ext = __filename.endsWith('.ts') ? 'ts' : 'js';

export function buildDataSourceOptions(
  env: DbEnv,
): MysqlDataSourceOptions {
  return {
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    charset: 'utf8mb4',
    timezone: 'Z',
    entities: [
      join(__dirname, '..', 'modules', '**', `*.entity.${ext}`),
    ],
    migrations: [
      join(__dirname, 'migrations', `*.${ext}`),
    ],
    synchronize: false,
  };
}