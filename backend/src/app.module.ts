import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { RedisModule } from './config/redis.module';
import { buildDataSourceOptions } from './database/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CacheModule } from './modules/cache/cache.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';
import { QueueModule } from './modules/queue/queue.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { VotesModule } from './modules/votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    EventEmitterModule.forRoot(),
    RedisModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions({
          DB_HOST: config.getOrThrow<string>('DB_HOST'),
          DB_PORT: config.getOrThrow<number>('DB_PORT'),
          DB_NAME: config.getOrThrow<string>('DB_NAME'),
          DB_USER: config.getOrThrow<string>('DB_USER'),
          DB_PASSWORD: config.getOrThrow<string>('DB_PASSWORD'),
        }),
        migrationsRun: true,
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    HealthModule,
    CaptchaModule,
    CacheModule,
    FilesModule,
    AuthModule,
    RealtimeModule,
    QueueModule,
    CommentsModule,
    VotesModule,
  ],
})
export class AppModule {}