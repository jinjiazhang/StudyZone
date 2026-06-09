import { IsEmail, IsOptional, IsString, Matches, MinLength, MaxLength } from 'class-validator';

import { USERNAME_PATTERN } from './username.util';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname!: string;

  @IsOptional()
  @IsString()
  @Matches(USERNAME_PATTERN, {
    message: 'username must be 3-20 characters of letters, digits, or underscore',
  })
  username?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
