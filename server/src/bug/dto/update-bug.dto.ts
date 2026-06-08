import { IsPositive } from 'class-validator';
import { BugType, BugStatus } from 'src/types';
export class UpdateBugDto {
  title?: string;
  description?: string;
  type?: BugType;
  status?: BugStatus;
  screenShotUrl?: string;
  deadline?: Date;
  developerId?: number;

  @IsPositive()
  timelineSeconds?: number
}
