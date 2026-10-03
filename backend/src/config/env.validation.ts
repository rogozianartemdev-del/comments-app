import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
    @IsInt() @Min(1) @Max(65535)
    PORT: number = 3000;
  
    @IsString() @IsNotEmpty()
    DB_HOST: string;
  
    @IsInt() @Min(1) @Max(65535)
    DB_PORT: number = 3306;
  
    @IsString() @IsNotEmpty()
    DB_NAME: string;
  
    @IsString() @IsNotEmpty()
    DB_USER: string;
  
    @IsString() @IsNotEmpty()
    DB_PASSWORD: string;
  
    @IsString() @IsNotEmpty()
    REDIS_URL: string;
  
    @IsString() @IsNotEmpty()
    FILE_SERVICE_URL: string;
  
    @IsString() @MinLength(16)
    JWT_SECRET: string;
  }
  
  export function validateEnv(config: Record<string, unknown>) {
    const validated = plainToInstance(EnvironmentVariables, config, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(validated, { skipMissingProperties: false });
    if (errors.length > 0) {
      throw new Error(`Invalid environment variables:\n${errors.toString()}`);
    }
    return validated;
  }