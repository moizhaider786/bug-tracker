import { IsEmail, Length } from "class-validator"

export class LoginDto {
    @IsEmail({}, {message: "Invalid Email"})
    email!: string

    @Length(6, undefined, {message: "Password must be at least 6 chars long"})
    password!: string
}