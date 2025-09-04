import { IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { JobSeekerRole, WorkType } from '../../../generated/prisma';

export class JobSeekerProfileDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsArray()
  @IsEnum(JobSeekerRole, { each: true })
  roles: JobSeekerRole[];

  @IsArray()
  @IsEnum(WorkType, { each: true })
  preferredWorkTypes: WorkType[];
}
