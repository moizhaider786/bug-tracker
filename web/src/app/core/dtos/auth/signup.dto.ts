import { UserRoles } from "../../../types/types"
export interface SignupDto {
    name: string,
    email: string,
    role: UserRoles,
    password: string,
}