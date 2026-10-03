import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'User Name: only Latin and numbers' })
  @MaxLength(50)
  username: string;

  @IsEmail({}, { message: 'Incorrect email' })
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'Home page: incorrect URL' })
  @MaxLength(255)
  homePage?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;

  @IsUUID()
  captchaId: string;

  @IsString()
  @MaxLength(10)
  captchaAnswer: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ListCommentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @IsIn(['username', 'email', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string;
}