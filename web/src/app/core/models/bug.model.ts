import { BugStatus, BugType } from "../../types/types"
import { Project } from "./project.model"
export interface Bug {
    id: number,
    title: string,
    description: string,
    status: BugStatus,
    type: BugType,
    deadline?: Date,
    timelineSeconds: number,
    screenShotUrl?: string,
    projectId: number,
    developerId: number,
    createdBy: number,
    createdAt: Date,
    updatedAt: Date,
    project?: Partial<Project>
}