export interface Project {
    id: number;
    name: string;
    description: string;
    createdBy: number;
    createdAt: Date;
}

export interface MemberProject {
    id: number;
    name: string;
    description: string;
    createdBy: number;
    createdAt: Date;
    assignedAt: string;
}