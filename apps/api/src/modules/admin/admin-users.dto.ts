import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: (typeof USER_STATUSES)[number];

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: (typeof USER_STATUSES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  dailyGoalMinutes?: number;
}

export class AdjustWalletDto {
  @IsOptional()
  @IsInt()
  gemsDelta?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  hearts?: number;
}
