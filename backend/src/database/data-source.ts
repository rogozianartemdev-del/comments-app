import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

export default new DataSource(
  buildDataSourceOptions({
    DB_HOST: process.env.DB_HOST ?? 'localhost',
    DB_PORT: Number(process.env.DB_PORT ?? 3306),
    DB_NAME: process.env.DB_NAME ?? 'comments',
    DB_USER: process.env.DB_USER ?? 'comments',
    DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  }),
);