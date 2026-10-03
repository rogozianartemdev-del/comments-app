import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Только латиница и цифры' })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}