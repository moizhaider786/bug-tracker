import { UserRoles } from "src/types"
import { IsEmail, IsNotEmpty, Length, IsEnum } from "class-validator"

export class SignupDto {
    @IsNotEmpty()
    name!: string

    @IsEmail({}, {message: "Invalid Email"})
    email!: string

    @Length(6, undefined, {message: "Password must be at least 6 chars long"})
    password!: string

    @IsNotEmpty()
    @IsEnum(UserRoles, {message: "Invalid User Role"})
    role!: UserRoles
}