import { USER_ROLES } from "src/types"
import { IsEmail, IsNotEmpty, Length } from "class-validator"

export class SignupDto {
    @IsNotEmpty()
    name!: string

    @IsEmail({}, {message: "Invalid Email"})
    email!: string

    @Length(6,6, {message: "Password must be at least 6 chars long"})
    password!: string

    @IsNotEmpty()
    role!: USER_ROLES
}