import { IsEnum, IsString,IsArray } from 'class-validator';
import { NumJobs, JobRoles } from '../../../generated/prisma';

export class EmployerProfileDto {
  @IsString()
  companyName: string;

  @IsEnum(NumJobs)
  numJobs: NumJobs;

  @IsArray()
  @IsEnum(JobRoles, { each: true })
  jobRoles: JobRoles[];
}
