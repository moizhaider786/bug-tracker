export enum UserRoles {
    MANAGER = "MANAGER",
    QA = "QA",
    DEVELOPER = "DEVELOPER"
}

export type JwtPayload = {
    id: number,
    email: string,
    role: UserRoles
}