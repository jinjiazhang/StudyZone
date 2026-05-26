import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SubmitAttemptDto {
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsInt()
  @Min(0)
  responseMs!: number;
}

export class CompleteSessionDto {
  @IsOptional()
  @IsBoolean()
  abandoned?: boolean;
}
