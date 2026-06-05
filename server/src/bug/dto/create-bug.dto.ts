import { BugType, BugStatus } from 'src/types';
export class CreateBugDto {
  title!: string;
  description!: string;
  type!: BugType;
  status!: BugStatus;
  deadline?: Date;
  timelineSeconds: number = 0;
  projectId!: number;
  developerId!: number;
  createdBy!: number;
}
