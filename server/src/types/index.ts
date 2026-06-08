export enum UserRoles {
    MANAGER = "MANAGER",
    QA = "QA",
    DEVELOPER = "DEVELOPER"
}

export type JwtPayload = {
    id: number,
    role: UserRoles
}

export enum BugStatus {
    NEW = "NEW",
    STARTED = "STARTED",
    COMPLETED = "COMPLETED",
    RESOLVED = "RESOLVED"
}

export enum BugType {
    BUG = "BUG",
    FEATURE = "FEATURE",
}