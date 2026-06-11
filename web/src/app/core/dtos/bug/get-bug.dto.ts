import { Bug } from '../../models/bug.model';

interface IGetBugs extends Bug {
  project: {
    name: string;
  };
}

export interface GetBugsResponseDto {
  data: IGetBugs[];
  total: number;
}
