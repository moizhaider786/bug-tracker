import { BugType, BugStatus } from 'src/types';
export class CreateBugDto {
  title!: string;
  description!: string;
  type!: BugType;
  status!: BugStatus;
  screenShotUrl?: string;
  deadline?: Date;
  projectId!: number;
  developerId!: number;
  createdBy!: number;
}
