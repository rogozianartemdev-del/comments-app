import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentFile } from './comment-file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentFile]),
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.getOrThrow<string>('FILE_SERVICE_URL'),
        timeout: 15000,
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}