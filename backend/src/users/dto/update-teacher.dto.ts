import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateTeacherDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  instrument?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  experience?: number;
}

