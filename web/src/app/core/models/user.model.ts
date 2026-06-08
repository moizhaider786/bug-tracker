import { UserRoles } from "../../types/types"
export interface User {
    id: number
    name: string,
    email: string,
    role: UserRoles,
    password: string,
    createdAt?: string,
}