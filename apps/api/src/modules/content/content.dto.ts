import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  prompt?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  answer?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  difficulty?: number;
}
