import { IsNumber, Min } from 'class-validator';
import { BugType, BugStatus } from 'src/types';
export class UpdateBugDto {
  title?: string;
  description?: string;
  type?: BugType;
  status?: BugStatus;
  screenShotUrl?: string;
  deadline?: Date;
  developerId?: number;

  @IsNumber()
  @Min(0)
  timelineSeconds?: number
}
