import { BugStatus, BugType } from "../../../types/types"
export interface CreateBugDto {
    title: string,
    description: string,
    status: BugStatus,
    type: BugType,
    deadline?: Date,
    projectId: number,
    developerId: number,
    createdBy: number,
}